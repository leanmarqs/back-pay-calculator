import express from "express";
import dotenv from "dotenv";
const app = express();
app.use(express.json());
dotenv.config();
const SERVER_PORT = Number(process.env.DEFAULT_SERVER_PORT) ||
    Number(process.env.ALTERNATIVE_SERVER_PORT);
app.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`);
});
