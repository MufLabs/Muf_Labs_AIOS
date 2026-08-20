import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    OllamaConfiguration
} from "./OllamaConfiguration.js";

import {
    OllamaProviderInfo
} from "./OllamaProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

export class OllamaProvider extends OpenAICompatibleProvider {

    public override readonly id =
        OllamaProviderInfo.id;

    public override readonly name =
        OllamaProviderInfo.name;

    constructor(
        configuration: OllamaConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return OllamaProviderInfo;

    }

}
