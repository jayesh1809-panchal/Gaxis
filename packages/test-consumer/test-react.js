const ReactSDK = require('@gaxis/react-sdk');

console.log('Testing @gaxis/react-sdk imports...');
console.log('GAxisProvider:', !!ReactSDK.GAxisProvider);
console.log('useAuth:', !!ReactSDK.useAuth);
console.log('useSession:', !!ReactSDK.useSession);
console.log('useRoles:', !!ReactSDK.useRoles);
console.log('usePermissions:', !!ReactSDK.usePermissions);
console.log('ProtectedRoute:', !!ReactSDK.ProtectedRoute);
console.log('RoleGuard:', !!ReactSDK.RoleGuard);
console.log('PermissionGuard:', !!ReactSDK.PermissionGuard);
