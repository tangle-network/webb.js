// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

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
  constructor () {
    super();
    this.sendEvent = this.emit;
  }
}
