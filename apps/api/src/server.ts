import express, {

    type Express

} from "express";

import { registerRoutes } from "./routes";

export function createServer(): Express {

    const app = express();

    app.use(express.json());

    registerRoutes(app);

    return app;

}