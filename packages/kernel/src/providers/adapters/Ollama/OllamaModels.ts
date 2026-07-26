import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    OllamaConfiguration
} from "./OllamaConfiguration";

export class OllamaModels {

    public static async discover(

        configuration: OllamaConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}