import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    OllamaConfiguration
} from "./OllamaConfiguration";

import {
    OllamaProviderInfo
} from "./OllamaProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

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