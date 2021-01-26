export type Subscription<T extends object> = {
  [Key in keyof T]: Function[];
};

export abstract class EventBus<T extends object> {
  protected subscriptions: Subscription<T> = {} as Subscription<T>;
  on = <E extends keyof T>(event: E, cb: (val: T[E]) => void): Function | void => {
    const listeners = this.subscriptions[event];
    if (listeners && listeners.indexOf(cb) > -1) {
      return;
    }
    this.subscriptions[event] = [...(this.subscriptions[event] || []), cb];
    return this.off(event, cb);
  };

  emit = <E extends keyof T>(event: E, data: T[E]) => {
    this.subscriptions[event]?.forEach((cb) => cb(data));
  };
  off = <E extends keyof T>(event: E, cb: (val: T[E]) => void) => {
    const listeners = this.subscriptions[event];

    this.subscriptions[event] = listeners ? [] : this.subscriptions[event].filter((c) => c !== cb);
  };
}
