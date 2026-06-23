const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../controllers');

const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Simple robust replacements for standard DB calls
    // Note: This is a brute-force regex approach tailored to the specific controller structure of G-Axis.
    
    // 1. findById -> findOne({ _id: id, tenantId: req.tenant._id })
    // Careful with findById(req.params.id)
    content = content.replace(/\.findById\((.*?)\)/g, '.findOne({ _id: $1, tenantId: req.tenant._id })');
    
    // 2. findByIdAndDelete -> findOneAndDelete({ _id: id, tenantId: req.tenant._id })
    content = content.replace(/\.findByIdAndDelete\((.*?)\)/g, '.findOneAndDelete({ _id: $1, tenantId: req.tenant._id })');
    
    // 3. findByIdAndUpdate -> findOneAndUpdate({ _id: id, tenantId: req.tenant._id }, ... )
    content = content.replace(/\.findByIdAndUpdate\((.*?),\s*(.*)\)/g, '.findOneAndUpdate({ _id: $1, tenantId: req.tenant._id }, $2)');
    
    // 4. Update create calls to inject tenantId
    // This is harder. Better to find .create({ and inject tenantId: req.tenant._id,
    content = content.replace(/\.create\(\{/g, '.create({\n            tenantId: req.tenant._id,');

    // 5. Update find({ ... }) to find({ tenantId: req.tenant._id, ... })
    // Only if it doesn't already have tenantId
    // Actually, simple regex for .find({ is .find({ tenantId: req.tenant._id,
    content = content.replace(/\.find\(\{/g, '.find({\n            tenantId: req.tenant._id,');

    // 6. Update findOne({ ... }) to findOne({ tenantId: req.tenant._id, ... })
    content = content.replace(/\.findOne\(\{/g, '.findOne({\n            tenantId: req.tenant._id,');

    // 7. Update updateMany({ ... })
    content = content.replace(/\.updateMany\(\{/g, '.updateMany({\n            tenantId: req.tenant._id,');
    
    // 8. Update deleteMany({ ... })
    content = content.replace(/\.deleteMany\(\{/g, '.deleteMany({\n            tenantId: req.tenant._id,');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Hardened ${file}`);
});
