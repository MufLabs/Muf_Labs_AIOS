import {
    ProviderRequest
} from "../../ProviderRequest";

export class AnthropicMapper {

    public static toMessagesRequest(

        request: ProviderRequest,

        model: string

    ): Record<string, unknown> {

        return {

            model,

            system:

                request.system,

            messages:

                request.messages,

            temperature:

                request.temperature,

            top_p:

                request.topP,

            max_tokens:

                request.maxTokens,

            stop_sequences:

                request.stop,

            stream:

                request.stream,

            tools:

                request.tools,

            tool_choice:

                request.toolChoice,

            metadata:

                request.metadata

        };

    }

}