import type { IoTATLScriptContext } from "cmf-core-connect-iot";

type Prettify<T> = {
    [K in keyof T]: T[K];
} & object;

export type IoTATLScriptContextTest = Prettify<Partial<IoTATLScriptContext> & { _execute: () => void | Promise<void> }>
