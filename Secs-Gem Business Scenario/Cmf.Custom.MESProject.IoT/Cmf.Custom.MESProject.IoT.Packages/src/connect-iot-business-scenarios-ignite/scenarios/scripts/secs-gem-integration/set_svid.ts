import { Cmf } from "cmf-lbos";
import { EventMapping, ScriptScopeBase } from "../types/globals";
import { DataType } from "cmf-core-chatbot/lib/side-bar-bot/script-executer/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SetSVIDWrapper extends ScriptScopeBase {
    [key: string]: any;

    private setSVID() {
        // PackagePacker: Start of Script

        const eventMapping = (this.answers.eventMapping as EventMapping).get(this.answers.eventCEID);
        const reportIdAndSvidIndex = eventMapping?.rptidAndSvidList.findIndex(item => item.rptid === this.answers.rptid)

        /**
         * Converts a SECS-GEM data type code to the corresponding CMF AutomationDataType.
         *
         * | SECS-GEM | Description                  | CMF AutomationDataType |
         * |----------|------------------------------|------------------------|
         * | U1       | Unsigned integer 1 byte      | Integer                |
         * | U2       | Unsigned integer 2 bytes     | Integer                |
         * | U4       | Unsigned integer 4 bytes     | Long                   |
         * | U8       | Unsigned integer 8 bytes     | Long                   |
         * | I1       | Signed integer 1 byte        | Integer                |
         * | I2       | Signed integer 2 bytes       | Integer                |
         * | I4       | Signed integer 4 bytes       | Integer                |
         * | I8       | Signed integer 8 bytes       | Long                   |
         * | F4       | Float 4 bytes                | Decimal                |
         * | F8       | Float 8 bytes (double)       | Decimal                |
         * | A        | ASCII value (text string)    | String                 |
         * | BI       | Binary value                 | Binary                 |
         * | BO       | Boolean value                | Boolean                |
         * | L        | List                         | Object                 |
         */
        function secsGemDataTypeToCmfDataType(secsGemType: string): DataType[keyof DataType] {
            switch (secsGemType?.toUpperCase()) {
                case "U1":
                case "U2":
                case "I1":
                case "I2":
                case "I4":
                    return "Integer";
                case "U4":
                case "U8":
                case "I8":
                    return "Long";
                case "F4":
                case "F8":
                    return "Decimal";
                case "A":
                    return "String";
                case "BI":
                    return "Binary";
                case "BO":
                    return "Boolean";
                case "L":
                    return "Object";
                default:
                    throw new Error(`Unsupported SECS-GEM data type: "${secsGemType}"`);
            }
        }

        if (!eventMapping?.rptidAndSvidList[reportIdAndSvidIndex]?.svidList.has(this.answers.svid)) {
            // Adding svid to the rptid if svid is not exist for the rptid
            eventMapping?.rptidAndSvidList[reportIdAndSvidIndex]?.svidList.set(this.answers.svid, {
                automationProtocolDataType: this.answers.svidDataType,
                dataType: secsGemDataTypeToCmfDataType(this.answers.svidDataType) as DataType,
                parameter: null
            });
        }

        // PackagePacker: End of Script
    }
}