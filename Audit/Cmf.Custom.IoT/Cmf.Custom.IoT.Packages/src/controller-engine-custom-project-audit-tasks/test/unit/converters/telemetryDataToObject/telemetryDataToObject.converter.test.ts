import "reflect-metadata";
import { Converter } from "@criticalmanufacturing/connect-iot-controller-engine";
// import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test/";
import * as chai from "chai";
import { TelemetryDataToObjectConverter } from "../../../../src/converters/telemetryDataToObject/telemetryDataToObject.converter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EngineTestSuite = require("@criticalmanufacturing/connect-iot-controller-engine/test").default;

describe("Telemetry Data To Object converter", () => {

    let converter: Converter.ConverterContainer;

    beforeEach(async () => {
        converter = await EngineTestSuite.createConverter({
            class: TelemetryDataToObjectConverter
        });
    });

    it("should convert", async () => {

        const rawValue = `Identifier,Value
                            Task Name,BuildMessageBusReplyTask
                            Injects,TYPES.Dependencies.Logger
                            Inputs,activate;errorCode
                            Outputs,replyObject;success;error
                            Lines of Code,130
                            `;

        /* Example int to string */
        const result: string = await converter.execute(rawValue, null);

        chai.expect(result).to.eql({
            taskName: ["BuildMessageBusReplyTask"],
            injects: [
                "TYPES.Dependencies.Logger"
            ],
            inputs: [
                "activate",
                "errorCode"
            ],
            outputs: [
                "replyObject",
                "success",
                "error"
            ],
            linesOfCode: [130]
        });
    });

});
