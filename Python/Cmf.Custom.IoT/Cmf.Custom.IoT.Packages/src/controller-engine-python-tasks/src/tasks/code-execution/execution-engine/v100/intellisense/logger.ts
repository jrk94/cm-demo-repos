/**
 * Logging interface. Depending on the settings, more than one destination may receive this entry
 */
export interface Logger {
    /**
     * Debug level messages
     * Messages that contain information normally of use only when debugging a program.
     * @param msg Message to log
     * @param meta Any number of objects to log
     */
    debug(msg: string, ...meta: any[]): void;

    /**
     * Informational messages
     * @param msg Message to log
     * @param meta Any number of objects to log
     */
    info(msg: string, ...meta: any[]): void;

    /**
     * Warning conditions.
     * @param msg Message to log
     * @param meta Any number of objects to log
     */
    warning(msg: string, ...meta: any[]): void;

    /**
     * Error conditions.
     * @param msg Message to log
     * @param meta Any number of objects to log
     */
    error(msg: string, ...meta: any[]): void;
}
