import { Authentication } from "../../common";

import { OpenAICompatibleConfiguration } from "./OpenAICompatibleConfiguration";

export class OpenAICompatibleAuthentication {

    public static create(

        configuration: OpenAICompatibleConfiguration

    ): Authentication {

        return {

            bearerToken: configuration.apiKey,

            organization: configuration.organization,

            project: configuration.project,

            additionalHeaders:

                configuration.defaultHeaders

        };

    }

}