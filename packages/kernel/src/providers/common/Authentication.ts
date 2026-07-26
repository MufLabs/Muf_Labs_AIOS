export interface Authentication {

    apiKey?: string;

    bearerToken?: string;

    organization?: string;

    project?: string;

    additionalHeaders?: Record<string, string>;

}