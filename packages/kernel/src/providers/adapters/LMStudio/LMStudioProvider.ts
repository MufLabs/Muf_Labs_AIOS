import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    LMStudioConfiguration
} from "./LMStudioConfiguration";

import {
    LMStudioProviderInfo
} from "./LMStudioProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

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