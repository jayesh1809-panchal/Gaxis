const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/../.env" });
const User = require("../src/models/User");
const { resolveUserPermissions } = require("../src/services/rbacService");

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    const user = users[0];
    if (!user) return console.log("No users in DB");
    console.log("User Email:", user.email);
    const { roles, permissions } = await resolveUserPermissions(user._id);
    console.log("User ID:", user._id);
    console.log("Roles:", roles);
    console.log("Has ai.query:", permissions.includes("ai.query"));
    process.exit(0);
}
run();
