import {
    ProviderModel
} from "../../";

import {
    OpenAICompatibleModels
} from "../OpenAICompatible";

import {
    LMStudioConfiguration
} from "./LMStudioConfiguration";

export class LMStudioModels {

    public static async discover(

        configuration: LMStudioConfiguration

    ): Promise<ProviderModel[]> {

        return OpenAICompatibleModels.discover(

            configuration

        );

    }

}