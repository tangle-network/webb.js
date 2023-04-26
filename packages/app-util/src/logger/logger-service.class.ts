// Copyright (C) 2020-2022 Acala Foundation.
// SPDX-License-Identifier: Apache-2.0

// Copyright 2022-2023 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.

import { LoggerEvent } from './logger-event.class.js';
import { Color } from './logs-colors.enum.js';
import { LogLevel } from './logs-level.enum.js';

type LoggersMaps = Record<string, LoggerService>;
type LoggerFn = (...message: any[]) => void;

export class LoggerService {
  public static readonly eventBus = new LoggerEvent();
  private static _loggers: LoggersMaps = {};
  public static _enabled = true;

  static new (ctx: string, logLevel: LogLevel = LogLevel.trace): LoggerService {
    const logger = new LoggerService(ctx, logLevel);

    LoggerService._loggers[ctx] = logger;

    return logger;
  }

  static get (ctx: string): LoggerService {
    const cachedLogger = LoggerService._loggers[ctx];

    if (cachedLogger) {
      return cachedLogger;
    }

    return LoggerService.new(ctx);
  }

  constructor (
    private readonly ctx: string,
    private readonly logLevel: LogLevel
  ) {
    return this;
  }

  private logger = (
    level: LogLevel = LogLevel.trace,
    color: Color,
    ...message: any[]
  ): any[] | void => {
    let m = '';

    try {
      m = JSON.stringify(message, null, 2);
    } catch (_) {
      m = 'Cant show message';
    }

    LoggerService.eventBus.sendEvent?.('log', {
      ctx: this.ctx,
      level,
      log: m
    });

    if (!LoggerService._enabled) {
      return;
    }

    if (this.logLevel <= level) {
      const date = new Date();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return [
        `${color}[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}], [${
          this.ctx
        }] `,
        ...message
      ];
    }
  };

  mutedLogger = (): null => null;

  debug = (function debug (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.debug, Color.FgBlack, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));

  error = (function error (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.error, Color.FgRed, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));

  info = (function info (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.info, Color.FgCyan, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));

  warn = (function warn (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.warn, Color.FgYellow, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));

  trace = (function trace (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.trace, Color.FgBlack, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));

  log = (function log (this: LoggerService, ...message: any[]) {
    const log = this.logger(LogLevel.log, Color.FgWhite, ...message);

    if (!log) {
      return this.mutedLogger;
    }

    return Function.prototype.bind.call(
      console.log,
      console,
      ...log
    ) as LoggerFn;
  }.call(this));
}
