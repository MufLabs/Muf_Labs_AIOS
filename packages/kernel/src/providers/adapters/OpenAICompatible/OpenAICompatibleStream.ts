import {

    StreamingChunk,
    StreamingClient

} from "../../common";

export class OpenAICompatibleStream

    implements StreamingClient {

    public async *stream(

        response: Response

    ): AsyncIterable<StreamingChunk> {

        if (!response.body) {

            return;

        }

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();

        let buffer = "";

        while (true) {

            const {

                done,

                value

            } = await reader.read();

            if (done) {

                buffer += decoder.decode();

            } else {

                buffer += decoder.decode(

                    value,

                    {

                        stream: true

                    }

                );

            }

            const events =
                buffer.split("\n\n");

            buffer =
                events.pop() ?? "";

            for (

                const event

                of events

            ) {

                if (

                    event.trim().length === 0

                ) {

                    continue;

                }

                const lines =

                    event

                        .split("\n")

                        .filter(

                            line =>

                                line.trim().length > 0

                        );

                let eventName = "message";

                const dataLines: string[] = [];

                for (

                    const line

                    of lines

                ) {

                    if (

                        line.startsWith("event:")

                    ) {

                        eventName =

                            line.substring(6).trim();

                    }

                    else if (

                        line.startsWith("data:")

                    ) {

                        dataLines.push(

                            line.substring(5).trim()

                        );

                    }

                }

                const data =

                    dataLines.join("\n");

                if (

                    data === "[DONE]"

                ) {

                    return;

                }

                if (

                    data.length === 0

                ) {

                    continue;

                }

                yield {

                    event: eventName,

                    data

                };

            }

            if (done) {

                break;

            }

        }

    }

}