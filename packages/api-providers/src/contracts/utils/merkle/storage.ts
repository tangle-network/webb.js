// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

export class Storage<T = Record<string, unknown>> {
  private db: T = {} as T;

  get<K extends keyof T> (key: K): T[K] | undefined {
    return this.db[key];
  }

  getOrDefault<K extends keyof T> (key: K, defaultElement: T[K]) {
    return this.db[key] ?? defaultElement;
  }

  put<K extends keyof T> (key: K, value: T[K]) {
    this.db[key] = value;
  }

  del<K extends keyof T> (key: K) {
    delete this.db[key];
  }

  putBatch (keyValues: Partial<T>[]) {
    keyValues.forEach((element: any) => {
      // @ts-ignore
      this.db[element.key] = element.value;
    });
  }
}
