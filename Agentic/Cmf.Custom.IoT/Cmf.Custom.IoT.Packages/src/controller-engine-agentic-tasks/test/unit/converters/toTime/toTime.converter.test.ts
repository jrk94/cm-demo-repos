import "reflect-metadata";
import type { Converter } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/test";
import { ToTimeConverter } from "../../../../src/converters/toTime/toTime.converter.js";
import chai from "chai";

const expect = chai.expect;

describe("ToTime converter", () => {

    let converter: Converter.ConverterContainer;

    beforeEach(async () => {
        converter = await EngineTestSuite.createConverter({
            class: ToTimeConverter
        });
    });

    describe("string expressions", () => {
        it("should convert seconds  (\"2s\")", async () => {
            const result: number = await converter.execute("2s", {});
            expect(result).to.equal(2000);
        });

        it("should convert minutes  (\"1m\")", async () => {
            const result: number = await converter.execute("1m", {});
            expect(result).to.equal(60_000);
        });

        it("should convert hours  (\"1.5h\")", async () => {
            const result: number = await converter.execute("1.5h", {});
            expect(result).to.equal(5_400_000);
        });

        it("should convert days  (\"2d\")", async () => {
            const result: number = await converter.execute("2d", {});
            expect(result).to.equal(172_800_000);
        });

        it("should convert weeks  (\"1w\")", async () => {
            const result: number = await converter.execute("1w", {});
            expect(result).to.equal(604_800_000);
        });

        it("should convert milliseconds  (\"500ms\")", async () => {
            const result: number = await converter.execute("500ms", {});
            expect(result).to.equal(500);
        });

        it("should accept long-form  (\"2 seconds\")", async () => {
            const result: number = await converter.execute("2 seconds", {});
            expect(result).to.equal(2000);
        });

        it("should accept long-form  (\"1 minute\")", async () => {
            const result: number = await converter.execute("1 minute", {});
            expect(result).to.equal(60_000);
        });
    });

    describe("numeric passthrough", () => {
        it("should return a plain number unchanged", async () => {
            const result: number = await converter.execute(3000, {});
            expect(result).to.equal(3000);
        });

        it("should return zero unchanged", async () => {
            const result: number = await converter.execute(0, {});
            expect(result).to.equal(0);
        });
    });

    describe("invalid input", () => {
        it("should throw for an unrecognized string", async () => {
            try {
                await converter.execute("not-a-time", {});
                expect.fail("Expected an error to be thrown");
            } catch (e: any) {
                expect(e.message).to.match(/invalid result for time expression/);
            }
        });

        it("should throw for an empty string", async () => {
            try {
                await converter.execute("", {});
                expect.fail("Expected an error to be thrown");
            } catch (e: any) {
                expect(e.message).to.match(/invalid time expression/);
            }
        });
    });
});
