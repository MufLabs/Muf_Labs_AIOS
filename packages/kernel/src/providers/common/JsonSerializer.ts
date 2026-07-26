export class JsonSerializer {

    public serialize<T>(

        value: T

    ): string {

        return JSON.stringify(value);

    }

    public deserialize<T>(

        json: string

    ): T {

        return JSON.parse(json) as T;

    }

}