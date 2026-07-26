import {

    StreamingChunk,
    StreamingClient

} from "../../common";

export class AnthropicStream

    implements StreamingClient {

    public async *stream(

        response: Response

    ): AsyncIterable<StreamingChunk> {

        if (!response.body) {

            return;

        }

        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {

            const {

                done,
                value

            } = await reader.read();

            if (done) {

                break;

            }

            buffer += decoder.decode(

                value,

                {

                    stream: true

                }

            );

            const events =

                buffer.split("\n\n");

            buffer =

                events.pop() ?? "";

            for (

                const event

                of events

            ) {

                const lines =

                    event

                        .split("\n")

                        .filter(

                            line =>

                                line.trim().length > 0

                        );

                let eventName = "message";

                let data = "";

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

                        data +=

                            line.substring(5).trim();

                    }

                }

                if (

                    data === "[DONE]"

                ) {

                    return;

                }

                yield {

                    event: eventName,

                    data

                };

            }

        }

    }

}