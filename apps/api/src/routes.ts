import { Express } from "express";

import { ChatController } from "./controllers/ChatController";

export function registerRoutes(

    app: Express

) {

    const controller = new ChatController();

    app.post(

        "/api/v1/chat",

        controller.chat

    );

}