import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    OpenRouterConfiguration
} from "./OpenRouterConfiguration.js";

export class OpenRouterModels {

    public static async discover(

        configuration: OpenRouterConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}
