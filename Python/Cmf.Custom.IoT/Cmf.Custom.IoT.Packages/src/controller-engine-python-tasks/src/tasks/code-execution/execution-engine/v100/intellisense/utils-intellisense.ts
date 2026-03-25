
export const TEMPLATE_INTELLISENSE_UTILS: string = `
/** Utilities useful for customizations */
export interface Utils {
    /**
     * Convert a value to a typed value.
     * Note: Booleans are true if (True, t, yes, y, 1). False otherwise!
     * @param value Original value
     * @param toType Destination value type (String, Decimal, Number, Integer, Long, Boolean, Object)
     * @param defaultValue: Optional default value. Throw exception if not possible to convert and no default value is provided.
     * @param throwOnError Optional flag to raise exceptions. If False, default value will be returned (or undefined)
     * returns value converted to the desired type
     */
    convertValueToType(value: any, toType: string, defaultValue?: any, throwOnError?: boolean): any;

    /**
     * Sleep for a specific number of milliseconds
     * @param ms Milliseconds to sleep
     */
    sleep(ms: number): Promise<void>;

    /**
     * Perform an action with some retry logic while *some* specific Mes System errors happen
     * @param logger Logger object to use
     * @param attempts Number of attempts to perform
     * @param sleepBetweenAttempts Interval to wait between attempts in milliseconds
     * @param code Code to execute
     */
    ExecuteWithSystemErrorRetry(logger: Logger, attempts: number, sleepBetweenAttempts: number, code: Function): Promise<any>;

    /**
     * Perform an action with some retry logic
     * @param logger Logger object to use
     * @param attempts Number of attempts to perform
     * @param sleepBetweenAttempts Interval to wait between attempts in milliseconds
     * @param code Code to execute
     */
    ExecuteWithRetry(logger: Logger, attempts: number, sleepBetweenAttempts: number, code: Function): Promise<any>;
}

`;
