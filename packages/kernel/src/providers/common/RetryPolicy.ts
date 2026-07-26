export interface RetryPolicy {

    maxAttempts: number;

    initialDelay: number;

    maxDelay: number;

    exponentialBackoff: boolean;

    retryOnStatusCodes?: number[];

}