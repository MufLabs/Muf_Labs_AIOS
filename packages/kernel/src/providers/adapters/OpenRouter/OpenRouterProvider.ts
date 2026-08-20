import {
    ProviderRequest
} from "../../ProviderRequest.js";

import {
    ProviderResponse
} from "../../ProviderResponse.js";

import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    OpenRouterConfiguration
} from "./OpenRouterConfiguration.js";

import {
    OpenRouterProviderInfo
} from "./OpenRouterProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

export class OpenRouterProvider extends OpenAICompatibleProvider {

    public override readonly id =
        OpenRouterProviderInfo.id;

    public override readonly name =
        OpenRouterProviderInfo.name;

    constructor(
        configuration: OpenRouterConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return OpenRouterProviderInfo;

    }

    public override async initialize(): Promise<void> {

        await super.initialize();

        this.info.models = [

            ...this.info.models

        ];

    }

    public override async execute(

        request: ProviderRequest

    ): Promise<ProviderResponse> {

        return super.execute(

            request

        );

    }

}
