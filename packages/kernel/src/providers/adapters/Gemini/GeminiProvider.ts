import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    GeminiConfiguration
} from "./GeminiConfiguration";

import {
    GeminiProviderInfo
} from "./GeminiProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

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