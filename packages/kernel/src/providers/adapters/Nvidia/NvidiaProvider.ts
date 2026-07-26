import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    NvidiaConfiguration
} from "./NvidiaConfiguration";

import {
    NvidiaProviderInfo
} from "./NvidiaProviderInfo";

import {
    ProviderInfo
} from "../../ProviderInfo";

export class NvidiaProvider extends OpenAICompatibleProvider {

    public override readonly id =
        NvidiaProviderInfo.id;

    public override readonly name =
        NvidiaProviderInfo.name;

    constructor(
        configuration: NvidiaConfiguration
    ) {

        super(configuration);

    }

    protected override buildInfo(): ProviderInfo {

        return NvidiaProviderInfo;

    }

}