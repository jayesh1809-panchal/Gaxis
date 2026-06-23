const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

const app = require("./app");
const connectDB = require("./config/db");
const seedDatabase = require("./utils/seedDatabase");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await seedDatabase();

    const server = app.listen(PORT, () => {
        console.log(`🚀 G-Axis Server Running On Port ${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
        console.error("UNHANDLED REJECTION! 💥 Shutting down...");
        console.error(err.name, err.message, err.stack);
        server.close(() => {
            process.exit(1);
        });
    });
};

startServer();