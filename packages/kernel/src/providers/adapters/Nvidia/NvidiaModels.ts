import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    NvidiaConfiguration
} from "./NvidiaConfiguration.js";

export class NvidiaModels {

    public static async discover(

        configuration: NvidiaConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}
