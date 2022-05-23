// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { EventBus } from '../shared/event-bus.class.js';
import { LogLevel } from './logs-level.enum.js';

export type LogEvent = {
  log: {
    ctx: string;
    log: string;
    level: LogLevel;
  };
};

export class LoggerEvent extends EventBus<LogEvent> {
  constructor() {
    super();
    this.sendEvent = this.emit;
  }
}
