
export const TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER_TOKEN: string = "<TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER_TOKEN>";

export const TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_FIELDS_TOKEN: string = "<TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_FIELDS_TOKEN>";

export const TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_DTS_TOKEN: string = "<TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_DTS_TOKEN>";

export const TEMPLATE_INTELLISENSE_FRAMEWORK: string = `
${TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_DTS_TOKEN}

/**
 * Access to the CMF Framework
 */
export interface Framework {

    /** Used to perform log operations */
    logger: Logger;

    /** Used to store and retrieve values */
    dataStore: DataStore;

    /** Message Bus access */
    messageBus: MessageBus;

    /** System (MES) access */
    system: SystemAPI;

    /** System (MES) access */
    LBOS: typeof LBOS;

    /** Utilities */
    utils: Utils;

    ${TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER_TOKEN}
    ${TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_FIELDS_TOKEN}
}

`;

/** Just the driver entry. It is optional */
export const TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER: string = `
    /** Used for driver interaction */
    driver: DriverProxy;

`;
