import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    OpenAIConfiguration
} from "./OpenAIConfiguration";

export class OpenAIModels {

    public static async discover(

        configuration: OpenAIConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}