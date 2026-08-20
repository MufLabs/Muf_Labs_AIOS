import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    LMStudioConfiguration
} from "./LMStudioConfiguration.js";

import {
    LMStudioProviderInfo
} from "./LMStudioProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

export class LMStudioProvider extends OpenAICompatibleProvider {

    public override readonly id =
        LMStudioProviderInfo.id;

    constructor(
        configuration: LMStudioConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return LMStudioProviderInfo;

    }

}
