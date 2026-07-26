export type HttpMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "HEAD"
    | "OPTIONS";

export interface HttpRequest {

    method: HttpMethod;

    url: string;

    headers?: Record<string, string>;

    query?: Record<string, string | number | boolean>;

    body?: unknown;

    timeout?: number;

    signal?: AbortSignal;

}