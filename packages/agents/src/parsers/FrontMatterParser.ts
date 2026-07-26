export class FrontMatterParser {

    public parse(content: string): Record<string, unknown> {

        const result: Record<string, unknown> = {};

        const lines = content.split(/\r?\n/);

        if (lines.length === 0 || lines[0].trim() !== "---") {

            return result;

        }

        let index = 1;

        while (index < lines.length) {

            const line = lines[index].trim();

            if (line === "---") {

                break;

            }

            if (!line) {

                index++;

                continue;

            }

            const separator = line.indexOf(":");

            if (separator < 0) {

                index++;

                continue;

            }

            const key = line.substring(0, separator).trim();

            let value = line.substring(separator + 1).trim();

            if (value === "") {

                const items: string[] = [];

                index++;

                while (index < lines.length) {

                    const item = lines[index].trim();

                    if (!item.startsWith("-")) {

                        index--;

                        break;

                    }

                    items.push(

                        item.substring(1).trim()

                    );

                    index++;

                }

                result[key] = items;

            }

            else if (value === "true") {

                result[key] = true;

            }

            else if (value === "false") {

                result[key] = false;

            }

            else if (!isNaN(Number(value))) {

                result[key] = Number(value);

            }

            else {

                result[key] = value;

            }

            index++;

        }

        return result;

    }

}