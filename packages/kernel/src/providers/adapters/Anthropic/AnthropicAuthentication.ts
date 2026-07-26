import {
    Authentication
} from "../../common";

import {
    AnthropicConfiguration
} from "./AnthropicConfiguration";

export class AnthropicAuthentication {

    public static create(

        configuration: AnthropicConfiguration

    ): Authentication {

        const additionalHeaders: Record<string, string> = {

            "anthropic-version":

                configuration.apiVersion ?? "2023-06-01"

        };

        if (

            configuration.beta

        ) {

            additionalHeaders["anthropic-beta"] =

                configuration.beta;

        }

        Object.assign(

            additionalHeaders,

            configuration.defaultHeaders ?? {}

        );

        return {

            bearerToken:

                configuration.apiKey,

            additionalHeaders

        };

    }

}