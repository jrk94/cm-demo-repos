
/**
 * Message Bus access to send and receive data
 */
export interface MessageBus {
    /**
     * Send a message and wait for its reply.
     * @param subject Subject of the message
     * @param msg Message to send
     * @param timeout Number of milliseconds to wait until a timeout error is thrown
     * @return Promise of a Reply message
     */
    sendRequest<T>(subject: string, msg: any, timeout?: number): Promise<T>;

    /**
     * Notify target of a new message
     * @param msg Message to send
     */
    publish(subject: string, msg: any): void;
}
