export interface ParserResult<T> {

    success: boolean;

    value?: T;

    errors: string[];

}