// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import { EventBus } from '../shared/event-bus.class.js';

class TestEvent extends EventBus<{ log: number }> {
  override readonly sendEvent: EventBus<{ log: number }>['emit'];

  constructor () {
    super();
    this.sendEvent = this.emit;
  }
}

describe('event emitting', () => {
  const testEvent = new TestEvent();

  it('event should be  emitted', async () => {
    let a = 0;
    const unsubscribe = testEvent.on('log', () => {
      a = a + 1;
    });

    expect(a).to.deep.equal(0);
    testEvent.sendEvent('log', 5);
    await 0;
    expect(a).to.deep.equal(1);

    if (unsubscribe) {
      unsubscribe();
    }
  });
  it('event value should be 5', () => {
    let a: number | null = null;

    testEvent.on('log', (value) => {
      a = value;
    });
    testEvent.sendEvent('log', 5);
    setTimeout(() => {
      expect(a).to.deep.equal(5);
    }, 1);
  });
});

describe('Subscriptions', () => {
  it('should unsubscribe', () => {
    const testEvent = new TestEvent();
    let a = 0;
    const unsubscribe = testEvent.on('log', () => {
      a = a + 1;
    });

    expect(a).to.deep.equal(0);
    testEvent.sendEvent('log', 5);

    if (unsubscribe) {
      unsubscribe();
    }

    setTimeout(() => {
      expect(a).to.deep.equal(1);
    }, 1);
  });
  it('Once will trigger only one time', () => {
    const testEvent = new TestEvent();
    let a = 0;

    testEvent.once('log', (log) => {
      a = log;
    });
    testEvent.sendEvent('log', 1);
    testEvent.sendEvent('log', 2);
    expect(a).to.deep.equal(1);
  });

  it('Unsubscribe all', () => {
    const testEvent = new TestEvent();
    let a = 0;

    testEvent.on('log', (log) => {
      a = log;
    });
    testEvent.unsubscribeAll();
    testEvent.sendEvent('log', 1);
    testEvent.sendEvent('log', 2);
    expect(a).to.deep.equal(0);
  });
});
