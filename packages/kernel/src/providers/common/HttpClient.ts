import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { ProviderException } from "./ProviderException";

export class HttpClient {

    public async send<T = unknown>(

        request: HttpRequest

    ): Promise<HttpResponse<T>> {

        const response = await fetch(

            request.url,

            {

                method: request.method,

                headers: request.headers,

                body:

                    request.body !== undefined

                        ? JSON.stringify(request.body)

                        : undefined,

                signal: request.signal

            }

        );

        const headers: Record<string, string> = {};

        response.headers.forEach(

            (

                value,

                key

            ) => {

                headers[key] = value;

            }

        );

        if (!response.ok) {

            throw new ProviderException(

                response.statusText,

                undefined,

                response.status

            );

        }

        const data =

            await response.json() as T;

        return {

            status: response.status,

            statusText: response.statusText,

            headers,

            data

        };

    }

}