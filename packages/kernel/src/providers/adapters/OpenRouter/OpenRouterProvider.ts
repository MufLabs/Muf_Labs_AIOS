import {
    ProviderRequest
} from "../../ProviderRequest";

import {
    ProviderResponse
} from "../../ProviderResponse";

import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    OpenRouterConfiguration
} from "./OpenRouterConfiguration";

import {
    OpenRouterProviderInfo
} from "./OpenRouterProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

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