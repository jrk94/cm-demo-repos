import {
    TaskDesignerLibraryService
} from "cmf-core-connect-iot";

import { TEMPLATE_INTELLISENSE_DATA_STORE } from "./execution-engine/v100/intellisense/data-store-intellisense";
import { TEMPLATE_INTELLISENSE_DRIVER_PROXY } from "./execution-engine/v100/intellisense/driver-proxy-intellisense";
import {
    TEMPLATE_INTELLISENSE_FRAMEWORK,
    TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_DTS_TOKEN,
    TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_FIELDS_TOKEN,
    TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER,
    TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER_TOKEN
} from "./execution-engine/v100/intellisense/framework-intellisense";
import { TEMPLATE_INTELLISENSE_FRAMEWORK_LBOS_TOKEN, TEMPLATE_INTELLISENSE_LBOS } from "./execution-engine/v100/intellisense/lbos-intellisense";
import { TEMPLATE_INTELLISENSE_LOGGER } from "./execution-engine/v100/intellisense/logger-intellisense";
import { TEMPLATE_INTELLISENSE_MESSAGE_BUS } from "./execution-engine/v100/intellisense/message-bus-intellisense";
import { TEMPLATE_INTELLISENSE_SYSTEM } from "./execution-engine/v100/intellisense/system-intellisense";
import { TEMPLATE_INTELLISENSE_UTILS } from "./execution-engine/v100/intellisense/utils-intellisense";

/**
 * Code execution task settings utilities - used for dts content handling
 */
export class CodeExecutionSettingsUtil {

    public static async getFrameworkTypings(hasDriver: boolean, library: TaskDesignerLibraryService): Promise<string> {

        let result: string = "";
        result += TEMPLATE_INTELLISENSE_LOGGER;
        result += TEMPLATE_INTELLISENSE_DATA_STORE;
        result += TEMPLATE_INTELLISENSE_DRIVER_PROXY;
        result += TEMPLATE_INTELLISENSE_MESSAGE_BUS;
        result += TEMPLATE_INTELLISENSE_SYSTEM;
        result += TEMPLATE_INTELLISENSE_LBOS;
        result += TEMPLATE_INTELLISENSE_UTILS;
        /**
         * TODO:
         * - Special system (getByName, etc)? TODO in the future
         * - File API... not for now + path methods -> Should be an utility to be used in custom tasks as well
         */
        result += TEMPLATE_INTELLISENSE_FRAMEWORK;

        // Load lbos d.ts from file
        const lbosDefinitions = await library?.loadDefinitionsFromFile("assets/@types/cmf-lbos/index.d.ts");

        // Additional user libs
        const fields = library?.fields ?? {};
        const definitions = library?.definitions ?? [];
        let customAccessorFields: string = "";
        let customDtsContents: string = "";

        for (const definition of definitions) {
            customDtsContents += `${definition}\n`;
        }
        for (const fieldName of Object.keys(fields)) {
            customAccessorFields += `${fieldName}: ${fields[fieldName]}\n`;
        }

        return (result
            .replace(TEMPLATE_INTELLISENSE_FRAMEWORK_LBOS_TOKEN, lbosDefinitions)
            .replace(TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER_TOKEN, hasDriver === true ? TEMPLATE_INTELLISENSE_FRAMEWORK_DRIVER : "")
            .replace(TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_DTS_TOKEN, customDtsContents)
            .replace(TEMPLATE_INTELLISENSE_FRAMEWORK_CUSTOM_FIELDS_TOKEN, customAccessorFields)
        );
    }
}
