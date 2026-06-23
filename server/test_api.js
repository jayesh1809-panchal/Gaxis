const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// To verify the database directly
dotenv.config({ path: 'd:/G-Axis/server/.env' });
const Application = require('d:/G-Axis/server/src/models/Application');

const API = 'http://localhost:5000/api/applications';

async function fetchAPI(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || res.statusText);
    return data;
}

async function runTests() {
    console.log('--- STARTING API TESTS ---');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB directly for verification.');
    
    let appId = null;
    let plainSecret = null;
    let appCode = 'TEST_APP_' + Math.floor(Math.random() * 10000);

    try {
        console.log('\n1. Test: Create Application');
        const createData = await fetchAPI(API, {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test Application',
                code: appCode,
                version: '1.0.0',
                frontendUrl: 'http://localhost:3000',
                backendUrl: 'http://localhost:4000',
                status: 'active'
            })
        });
        
        const createdApp = createData.data;
        appId = createdApp._id;
        plainSecret = createdApp.plainClientSecret;
        
        console.log('✅ Created successfully.');
        console.assert(plainSecret, 'plainClientSecret should be returned during creation.');
        console.assert(!createdApp.clientSecret, 'hashed clientSecret should NOT be returned.');
        console.assert(createdApp.clientId.startsWith(appCode.toLowerCase()), 'clientId should start with code.');

        console.log('\n2. Test: Database Verification');
        const dbApp = await Application.findById(appId);
        console.log('✅ Found in DB.');
        console.assert(dbApp.clientSecret, 'hashed clientSecret MUST exist in DB.');
        const isMatch = await bcrypt.compare(plainSecret, dbApp.clientSecret);
        console.assert(isMatch, 'The plainClientSecret returned MUST match the hashed clientSecret in DB.');
        console.log('✅ clientSecret hash verified successfully.');

        console.log('\n3. Test: Get Applications (No Secrets Leak)');
        const getData = await fetchAPI(API);
        const fetchedApp = getData.data.find(a => a._id === appId);
        console.log('✅ Fetched list successfully.');
        console.assert(!fetchedApp.clientSecret, 'clientSecret MUST NOT leak in GET all.');
        console.assert(!fetchedApp.plainClientSecret, 'plainClientSecret MUST NOT leak in GET all.');
        console.assert(getData.pagination, 'Pagination metadata MUST exist.');

        console.log('\n4. Test: Search Applications');
        const searchData = await fetchAPI(`${API}?search=${appCode.substring(0, 5)}`);
        console.log('✅ Search executed.');
        console.assert(searchData.data.length > 0, 'Search should find the newly created app.');

        console.log('\n5. Test: Filter By Status');
        const filterData = await fetchAPI(`${API}?status=active`);
        console.log('✅ Filter executed.');
        console.assert(filterData.data.every(a => a.status === 'active'), 'Filter should only return active apps.');

        console.log('\n6. Test: Update Application');
        const updateData = await fetchAPI(`${API}/${appId}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: 'Updated Test App',
                clientId: 'malicious_overwrite'
            })
        });
        console.log('✅ Update executed.');
        console.assert(updateData.data.name === 'Updated Test App', 'Name should update.');
        console.assert(updateData.data.clientId !== 'malicious_overwrite', 'clientId MUST NOT be overwritable.');

        console.log('\n7. Test: Disable Application');
        const disableData = await fetchAPI(`${API}/${appId}`, { method: 'PUT', body: JSON.stringify({ status: 'inactive' }) });
        console.assert(disableData.data.status === 'inactive', 'App should be inactive.');

        console.log('\n8. Test: Enable Application');
        const enableData = await fetchAPI(`${API}/${appId}`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) });
        console.assert(enableData.data.status === 'active', 'App should be active again.');

        console.log('\n9. Test: Delete Application');
        await fetchAPI(`${API}/${appId}`, { method: 'DELETE' });
        const finalDbCheck = await Application.findById(appId);
        console.assert(!finalDbCheck, 'App should be removed from DB.');
        console.log('✅ App deleted successfully.');

        console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
    } finally {
        // Cleanup if failed
        if (appId) {
            await Application.findByIdAndDelete(appId).catch(()=>null);
        }
        process.exit(0);
    }
}

runTests();
