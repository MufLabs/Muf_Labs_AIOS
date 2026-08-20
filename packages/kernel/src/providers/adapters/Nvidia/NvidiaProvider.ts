import {
    OpenAICompatibleProvider
} from "../OpenAICompatible";

import {
    NvidiaConfiguration
} from "./NvidiaConfiguration.js";

import {
    NvidiaProviderInfo
} from "./NvidiaProviderInfo.js";

import {
    ProviderInfo
} from "../../ProviderInfo.js";

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
