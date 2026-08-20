import {
    OpenAICompatibleProvider
} from "../OpenAICompatible/index.js";

import {
    OpenAIConfiguration
} from "./OpenAIConfiguration.js";

import {
    OpenAIProviderInfo
} from "./OpenAIProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

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
