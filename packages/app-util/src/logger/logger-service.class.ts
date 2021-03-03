import { LogLevel } from './logs-level.enum';
import { LoggerEvent } from './logger-event.class';
import { Color } from './logs-colors.enum';

type LoggersMaps = Record<string, LoggerService>;

export class LoggerService {
  public static readonly eventBus = new LoggerEvent();
  private static _loggers: LoggersMaps = {};
  public static _enabled = true;

  static new(ctx: string, logLevel: LogLevel = LogLevel.trace): LoggerService {
    const logger = new LoggerService(ctx, logLevel);
    LoggerService._loggers[ctx] = logger;
    return logger;
  }

  static get(ctx: string): LoggerService {
    const cachedLogger = LoggerService._loggers[ctx];
    if (cachedLogger) {
      return cachedLogger;
    }
    return LoggerService.new(ctx);
  }

  constructor(private readonly ctx: string, private readonly logLevel: LogLevel) {
    return this;
  }

  private logger = (level: LogLevel = LogLevel.trace, color: Color, ...message: any[]) => {
    let m = '';
    try {
      m = JSON.stringify(message, null, 2);
    } catch (e) {
      m = 'Cant show message';
    }
    LoggerService.eventBus.emit('log', {
      level,
      ctx: this.ctx,
      log: m
    });
    if (!LoggerService._enabled) {
      return;
    }
    if (this.logLevel <= level) {
      const date = new Date();
      console.log(
        `${color}[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] , [${this.ctx}] `,
        ...message
      );
    }
  };

  debug(...message: any[]) {
    this.logger(LogLevel.debug, Color.FgBlack, ...message);
  }

  error(...message: any[]) {
    this.logger(LogLevel.error, Color.FgRed, ...message);
  }

  info(...message: any[]) {
    this.logger(LogLevel.info, Color.FgCyan, ...message);
  }

  warn(...message: any[]) {
    this.logger(LogLevel.warn, Color.FgYellow, ...message);
  }

  log(...message: any[]) {
    this.logger(LogLevel.log, Color.FgWhite, ...message);
  }

  trace(...message: any[]) {
    if (this.logLevel <= LogLevel.trace) {
      console.log(`  [${this.ctx}] ${Color.FgBlack} ${message.join('')}`);
    }
  }
}
