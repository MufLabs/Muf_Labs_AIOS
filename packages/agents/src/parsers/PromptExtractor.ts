export class PromptExtractor {

    public extract(content: string): string {

        const lines = content.split(/\r?\n/);

        let start = 0;

        if (lines[0]?.trim() === "---") {

            start = 1;

            while (

                start < lines.length &&

                lines[start].trim() !== "---"

            ) {

                start++;

            }

            start++;

        }

        return lines

            .slice(start)

            .join("\n")

            .trim();

    }

}