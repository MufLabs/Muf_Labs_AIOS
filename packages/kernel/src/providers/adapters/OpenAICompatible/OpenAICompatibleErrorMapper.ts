import { ProviderException } from "../../common";

export class OpenAICompatibleErrorMapper {

    public static map(

        error: unknown,

        provider: string = "OpenAI Compatible"

    ): ProviderException {

        if (

            error instanceof ProviderException

        ) {

            return error;

        }

        if (

            error instanceof Error

        ) {

            return new ProviderException(

                error.message,

                provider

            );

        }

        return new ProviderException(

            "Unknown provider error.",

            provider

        );

    }

    public static fromHttpStatus(

        status: number,

        message: string,

        provider: string = "OpenAI Compatible"

    ): ProviderException {

        switch (status) {

            case 400:

                return new ProviderException(

                    `Bad Request: ${message}`,

                    provider,

                    status

                );

            case 401:

                return new ProviderException(

                    `Authentication failed: ${message}`,

                    provider,

                    status

                );

            case 403:

                return new ProviderException(

                    `Access denied: ${message}`,

                    provider,

                    status

                );

            case 404:

                return new ProviderException(

                    `Requested resource was not found.`,

                    provider,

                    status

                );

            case 408:

                return new ProviderException(

                    `Request timeout.`,

                    provider,

                    status

                );

            case 409:

                return new ProviderException(

                    `Request conflict.`,

                    provider,

                    status

                );

            case 422:

                return new ProviderException(

                    `Invalid request.`,

                    provider,

                    status

                );

            case 429:

                return new ProviderException(

                    `Rate limit exceeded.`,

                    provider,

                    status

                );

            case 500:

                return new ProviderException(

                    `Internal server error.`,

                    provider,

                    status

                );

            case 502:

                return new ProviderException(

                    `Bad gateway.`,

                    provider,

                    status

                );

            case 503:

                return new ProviderException(

                    `Provider unavailable.`,

                    provider,

                    status

                );

            case 504:

                return new ProviderException(

                    `Gateway timeout.`,

                    provider,

                    status

                );

            default:

                return new ProviderException(

                    message,

                    provider,

                    status

                );

        }

    }

}