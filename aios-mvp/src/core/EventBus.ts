// EventBus - MufLabs AIOS MVP
// Sistema de eventos interno usando EventEmitter de Node.js

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import type { IEventBus, Message, EventChannel, EventHandler, MessageType } from '../types/index.js';

export class EventBus implements IEventBus {
  private emitter: EventEmitter;
  private static instance: EventBus;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(channel: EventChannel, message: Message): void {
    this.emitter.emit(channel, message);
  }

  subscribe(channel: EventChannel, handler: EventHandler): () => void {
    this.emitter.on(channel, handler);
    return () => {
      this.emitter.off(channel, handler);
    };
  }

  publishToAgent(agentId: string, message: Message): void {
    const channel = `agent:${agentId}` as EventChannel;
    this.publish(channel, message);
  }

  subscribeToAgent(agentId: string, handler: EventHandler): () => void {
    const channel = `agent:${agentId}` as EventChannel;
    return this.subscribe(channel, handler);
  }

  getChannelSubscriberCount(channel: EventChannel): number {
    return this.emitter.listenerCount(channel);
  }

  // Método helper para crear mensajes estandarizados
  static createMessage(
    type: MessageType,
    source: string,
    target: string,
    payload: unknown,
    correlationId: string,
    ttl: number = 5000
  ): Message {
    return {
      id: uuidv4(),
      type,
      source,
      target,
      payload,
      correlationId,
      timestamp: new Date(),
      ttl,
    };
  }
}