// Event types - MufLabs AIOS MVP
// Definiciones del sistema de eventos/mensajes

export type MessageType = 'command' | 'event' | 'result' | 'error' | 'log';

export interface Message {
  id: string;
  type: MessageType;
  source: string;
  target: string;
  payload: unknown;
  correlationId: string;
  timestamp: Date;
  ttl: number;               // Tiempo de vida en ms, 0 = forever
}

export type EventChannel =
  | `session:${string}`
  | `workflow:${string}`
  | `agent:${string}`
  | `ui:${string}`
  | `system:${string}`;

export type EventHandler = (message: Message) => void;

export interface IEventBus {
  publish(channel: EventChannel, message: Message): void;
  subscribe(channel: EventChannel, handler: EventHandler): () => void;
  publishToAgent(agentId: string, message: Message): void;
  subscribeToAgent(agentId: string, handler: EventHandler): () => void;
  getChannelSubscriberCount(channel: EventChannel): number;
}