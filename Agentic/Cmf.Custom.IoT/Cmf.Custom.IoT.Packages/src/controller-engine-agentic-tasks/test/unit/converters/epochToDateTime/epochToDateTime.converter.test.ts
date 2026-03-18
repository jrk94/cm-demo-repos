import "reflect-metadata";
import type { Converter } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/dist/test";
import { expect } from "chai";
import { EpochToDateTimeConverter } from "../../../../src/converters/epochToDateTime/epochToDateTime.converter.js";

describe("Epoch To DateTime converter", () => {

    let converter: Converter.ConverterContainer;

    beforeEach(async () => {
        converter = await EngineTestSuite.createConverter({
            class: EpochToDateTimeConverter
        });
    });

    it("should convert a numeric epoch to a Date", async () => {
        const epoch = 1000000000000; // 2001-09-09T01:46:40.000Z
        const result: Date = await converter.execute(epoch, {});
        expect(result).to.be.instanceOf(Date);
        expect(result.getTime()).to.equal(epoch);
    });

    it("should convert a string epoch to a Date", async () => {
        const epoch = 1000000000000;
        const result: Date = await converter.execute(String(epoch), {});
        expect(result).to.be.instanceOf(Date);
        expect(result.getTime()).to.equal(epoch);
    });

    it("should convert epoch 0 to Unix epoch start", async () => {
        const result: Date = await converter.execute(0, {});
        expect(result.getTime()).to.equal(0);
    });

    it("should throw for a non-numeric string", async () => {
        try {
            await converter.execute("not-a-number", {});
            expect.fail("Expected error was not thrown");
        } catch (err: any) {
            expect(err.message).to.include("Invalid epoch value");
        }
    });

});
