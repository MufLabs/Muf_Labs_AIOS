import { describe, it, expect } from 'vitest';
import { EventBus } from '../core/EventBus.js';

describe('EventBus', () => {
  it('should be a singleton', () => {
    const bus1 = EventBus.getInstance();
    const bus2 = EventBus.getInstance();
    expect(bus1).toBe(bus2);
  });

  it('should publish and receive messages', () => {
    const bus = EventBus.getInstance();
    const messages: unknown[] = [];

    const unsubscribe = bus.subscribe('workflow:created', (msg) => {
      messages.push(msg);
    });

    const msg = EventBus.createMessage('event', 'test', 'ui', { foo: 'bar' }, 'corr-1');
    bus.publish('workflow:created', msg);

    expect(messages.length).toBe(1);
    expect(messages[0]).toEqual(msg);

    unsubscribe();
  });

  it('should support multiple subscribers on same channel', () => {
    const bus = EventBus.getInstance();
    const results: number[] = [];

    const unsub1 = bus.subscribe('agent:status', () => { results.push(1); });
    const unsub2 = bus.subscribe('agent:status', () => { results.push(2); });

    const msg = EventBus.createMessage('event', 'test', 'ui', {}, 'corr-2');
    bus.publish('agent:status', msg);

    expect(results).toContain(1);
    expect(results).toContain(2);
    expect(results.length).toBe(2);

    unsub1();
    unsub2();
  });

  it('should allow unsubscribing', () => {
    const bus = EventBus.getInstance();
    let count = 0;

    const unsubscribe = bus.subscribe('workflow:completed', () => {
      count++;
    });

    const msg = EventBus.createMessage('event', 'test', 'ui', {}, 'corr-3');
    bus.publish('workflow:completed', msg);
    expect(count).toBe(1);

    unsubscribe();
    bus.publish('workflow:completed', msg);
    expect(count).toBe(1); // Still 1, not 2
  });

  it('should publish to agent channels', () => {
    const bus = EventBus.getInstance();
    const received: unknown[] = [];

    const unsubscribe = bus.subscribeToAgent('agent-1', (msg) => {
      received.push(msg);
    });

    const msg = EventBus.createMessage('command', 'engine', 'agent-1', { task: 'analyze' }, 'corr-4');
    bus.publishToAgent('agent-1', msg);

    expect(received.length).toBe(1);

    // Should NOT receive on different agent
    bus.publishToAgent('agent-2', msg);
    expect(received.length).toBe(1);

    unsubscribe();
  });

  it('should track subscriber count', () => {
    const bus = EventBus.getInstance();

    const unsub1 = bus.subscribe('workflow:started', () => {});
    expect(bus.getChannelSubscriberCount('workflow:started')).toBe(1);

    const unsub2 = bus.subscribe('workflow:started', () => {});
    expect(bus.getChannelSubscriberCount('workflow:started')).toBe(2);

    unsub1();
    expect(bus.getChannelSubscriberCount('workflow:started')).toBe(1);

    unsub2();
    expect(bus.getChannelSubscriberCount('workflow:started')).toBe(0);
  });

  it('should create messages with correct structure', () => {
    const msg = EventBus.createMessage('event', 'source', 'target', { key: 'value' }, 'corr-5');

    expect(msg.id).toBeDefined();
    expect(msg.type).toBe('event');
    expect(msg.source).toBe('source');
    expect(msg.target).toBe('target');
    expect(msg.payload).toEqual({ key: 'value' });
    expect(msg.correlationId).toBe('corr-5');
    expect(msg.timestamp).toBeInstanceOf(Date);
    expect(msg.ttl).toBe(5000);
  });

  it('should support custom TTL', () => {
    const msg = EventBus.createMessage('event', 'a', 'b', {}, 'c', 10000);
    expect(msg.ttl).toBe(10000);
  });

  it('should handle subscribe to non-existent agent gracefully', () => {
    const bus = EventBus.getInstance();
    let called = false;

    const unsubscribe = bus.subscribeToAgent('ghost-agent', () => {
      called = true;
    });

    // Publishing to general channel should NOT trigger agent subscription
    const msg = EventBus.createMessage('event', 'test', 'ui', {}, 'corr-6');
    bus.publish('workflow:created', msg);
    expect(called).toBe(false);

    unsubscribe();
  });
});