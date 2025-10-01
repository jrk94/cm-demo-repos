import { injectable } from "inversify";
import { Logger, LogMethod } from "@criticalmanufacturing/connect-iot-common";

@injectable()
export class LoggerMock implements Logger {
    notice: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    crit: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    alert: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    emerg: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    debug: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    info: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    warning: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    error: LogMethod = (msg: string, ...meta: any[]): Logger => {
        return null as any;
    };
    public setIdentificationTokens(tokens: any): void {
        throw new Error("Method not implemented.");
    }
    public getIdentificationTokens(): any {
        throw new Error("Method not implemented.");
    }
    public setLogTransports(transports: LogTransport[]): void {
        throw new Error("Method not implemented.");
    }
    public setLogTransportsFromConfigurationFile(file: string): void {
        throw new Error("Method not implemented.");
    }
    public reconfigureLogTransportsFromConfigurationFile(): void {
        throw new Error("Method not implemented.");
    }
    public reconfigureLogTransports(): void {
        throw new Error("Method not implemented.");
    }
    public clone(tokens: any): Logger {
        throw new Error("Method not implemented.");
    }
    close(): void {
        return null as any;
    }
}


export enum LogTransportType {
    /** Log to console  https://github.com/winstonjs/winston/blob/master/docs/transports.md#console-transport */
    Console = "Console",
    /** Log to file https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport */
    File = "File",
    /** Log to an Http server https://github.com/winstonjs/winston/blob/master/docs/transports.md#http-transport */
    Http = "Http",
    /** Log to open telemetry https://www.npmjs.com/package/@opentelemetry/instrumentation-winston */
    OTLP = "OTLP",
}
export interface LogTransport {
    /** Transport "unique" identifer. Only necessary if multiple transports of the same type are used */
    id?: string;
    /** Type of Transport log */
    type: LogTransportType;
    /** Custom settings specific for the transport */
    options?: any;
    /** List of allowed application to use the transport. Default is all */
    applications?: string[];
}