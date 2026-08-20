import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    GeminiConfiguration
} from "./GeminiConfiguration.js";

import {
    GeminiProviderInfo
} from "./GeminiProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

export class GeminiProvider extends OpenAICompatibleProvider {

    public override readonly id =
        GeminiProviderInfo.id;

    public override readonly name =
        GeminiProviderInfo.name;

    constructor(
        configuration: GeminiConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return GeminiProviderInfo;

    }

}
