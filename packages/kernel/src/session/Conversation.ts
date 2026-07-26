import { ConversationMessage } from "./ConversationMessage";

export class Conversation {

    private readonly history: ConversationMessage[] = [];

    public add(
        message: ConversationMessage
    ): void {

        this.history.push(message);

    }

    public all(): ConversationMessage[] {

        return [...this.history];

    }

    public last(): ConversationMessage | undefined {

        return this.history.at(-1);

    }

    public size(): number {

        return this.history.length;

    }

    public clear(): void {

        this.history.length = 0;

    }

}