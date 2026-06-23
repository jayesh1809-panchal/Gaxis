const sdk = require('./src/index');

if (!sdk.GAxisProvider || !sdk.useAuth || !sdk.RoleGuard) {
    throw new Error('Failed to export expected modules.');
}

console.log('React SDK successfully exported modules:');
console.log(Object.keys(sdk).join(', '));
