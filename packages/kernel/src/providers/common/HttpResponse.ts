export interface HttpResponse<T = unknown> {

    status: number;

    statusText: string;

    headers: Record<string, string>;

    data: T;

}