type Event = Record<string, unknown>;
export type Subscription<T extends Event = Event> = {
  [Key in keyof T]: Array<(val: T[Key]) => any>;
};

export abstract class EventBus<T extends Event> {
  protected subscriptions: Subscription<T> = {} as Subscription<T>;

  on = <E extends keyof T>(event: E, cb: (val: T[E]) => void): (() => void) | void => {
    const listeners = this.subscriptions[event];
    if (listeners && listeners.indexOf(cb) > -1) {
      return;
    }
    this.subscriptions[event] = [...(this.subscriptions[event] || []), cb];
    return () => this.off(event, cb);
  };

  emit = <E extends keyof T>(event: E, data: T[E]) => {
    this.subscriptions[event]?.forEach((cb) => cb(data));
  };

  off = <E extends keyof T>(event: E, cb: (val: T[E]) => void) => {
    const listeners = this.subscriptions[event];

    this.subscriptions[event] = listeners ? [] : this.subscriptions[event].filter((c) => c !== cb);
  };
}
