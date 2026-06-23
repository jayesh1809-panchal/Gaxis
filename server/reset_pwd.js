const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://techdhruv16_db_user:LXyJX5FmT7QTcnLS@cluster0.gyy2ckc.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const defaultTenant = await mongoose.connection.db.collection('tenants').findOne({ code: 'DEFAULT' });
    await mongoose.connection.db.collection('users').updateOne(
      { email: 'superadmin@g-axis.com' },
      { $set: { tenantId: defaultTenant._id, employeeId: 'SYS-ADMIN-1' } }
    );
    console.log('User moved to DEFAULT tenant successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
