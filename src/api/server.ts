import express from "express"

const app = express()

import "./routes/loader.js"
import { appRouter } from './decorator.js';
import { authMiddleware } from "./middlewares/auth.js";
import { Logger } from "../logger.js";
import { port } from "../config.js";

app.use(express.json());
app.use(authMiddleware)
app.use("/api/v1", appRouter);

app.listen(port, () => {
  Logger.Logger.info(`Server is running on port ${port}`);
});

