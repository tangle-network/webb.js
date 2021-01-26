import { EventBus } from '../shared/event-bus.class';

describe('event emitting', () => {
  class TestEvent extends EventBus<{ log: number }> {}

  const testEvent = new TestEvent();
  test('event should be  emitted', () => {
    let a = 0;
    const unsubscribe = testEvent.on('log', () => {
      a = a + 1;
    });
    expect(a).toEqual(0);
    testEvent.emit('log', 5);
    setTimeout(() => {
      expect(a).toEqual(1);
    }, 1);
    if (unsubscribe) {
      unsubscribe();
    }
  });
  test('event value should be 5', () => {
    let a: number | null = null;
    testEvent.on('log', (value) => {
      a = value;
    });
    testEvent.emit('log', 5);
    setTimeout(() => {
      expect(a).toEqual(5);
    }, 1);
  });
});

describe('Subscriptions', () => {
  class TestEvent extends EventBus<{ log: number }> {}

  const testEvent = new TestEvent();
  test('should unsubscribe', () => {
    let a = 0;
    const unsubscribe = testEvent.on('log', () => {
      a = a + 1;
    });
    expect(a).toEqual(0);
    testEvent.emit('log', 5);
    if (unsubscribe) {
      unsubscribe();
    }
    setTimeout(() => {
      expect(a).toEqual(0);
    }, 1);
  });
});
