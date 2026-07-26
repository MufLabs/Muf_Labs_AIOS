import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    OpenAIConfiguration
} from "./OpenAIConfiguration";

import {
    OpenAIProviderInfo
} from "./OpenAIProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

export class OpenAIProvider extends OpenAICompatibleProvider {

    public override readonly id =
        OpenAIProviderInfo.id;

    public override readonly name =
        OpenAIProviderInfo.name;

    constructor(
        configuration: OpenAIConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return OpenAIProviderInfo;

    }

    public override async initialize(): Promise<void> {

        await super.initialize();

        this.info.models = [

            ...this.info.models

        ];

    }

}