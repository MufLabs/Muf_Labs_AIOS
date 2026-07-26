import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    GeminiConfiguration
} from "./GeminiConfiguration";

export class GeminiModels {

    public static async discover(

        configuration: GeminiConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}