import dotenv from "dotenv";
dotenv.config();

//import test from "./test.js"

//console.log(test);

import express from "express";

import webhookRoutes from "./routes/webhook.route.js";
import businessRoute from "./routes/business.routes.js";

const app = express();
app.use(express.json());


app.use("/webhook", webhookRoutes);
app.use("/business",businessRoute);

export default app;