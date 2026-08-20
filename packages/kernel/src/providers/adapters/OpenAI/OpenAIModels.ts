import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible/index.js";

import {
    OpenAIConfiguration
} from "./OpenAIConfiguration.js";

export class OpenAIModels {

    public static async discover(

        configuration: OpenAIConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}
