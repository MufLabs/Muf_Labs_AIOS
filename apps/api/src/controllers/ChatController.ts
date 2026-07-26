import {

    Request,

    Response

} from "express";

import { ConversationService }

    from "../services/ConversationService";

export class ChatController {

    private readonly service =

        new ConversationService();

    chat = async (

        req: Request,

        res: Response

    ) => {

        const result =

            await this.service.execute(

                req.body.prompt

            );

        res.json(result);

    };

}