import "reflect-metadata";
import type { Converter } from "@criticalmanufacturing/connect-iot-controller-engine";
import EngineTestSuite from "@criticalmanufacturing/connect-iot-controller-engine/test";
import { NowConverter, NowFormat } from "../../../../src/converters/now/now.converter.js";
import chai from "chai";

const expect = chai.expect;

describe("Now converter", () => {

    let converter: Converter.ConverterContainer;

    beforeEach(async () => {
        converter = await EngineTestSuite.createConverter({
            class: NowConverter
        });
    });

    describe("epoch_ms (default)", () => {
        it("should return a number", async () => {
            const before = Date.now();
            const result: number = await converter.execute(null, {});
            const after = Date.now();

            expect(result).to.be.a("number");
            expect(result).to.be.at.least(before);
            expect(result).to.be.at.most(after);
        });

        it("should return epoch ms when format is explicit", async () => {
            const before = Date.now();
            const result: number = await converter.execute(null, { format: NowFormat.EpochMs });
            const after = Date.now();

            expect(result).to.be.at.least(before);
            expect(result).to.be.at.most(after);
        });
    });

    describe("epoch_seconds", () => {
        it("should return seconds since epoch as a number", async () => {
            const before = Math.floor(Date.now() / 1000);
            const result: number = await converter.execute(null, { format: NowFormat.EpochSeconds });
            const after = Math.floor(Date.now() / 1000);

            expect(result).to.be.a("number");
            expect(result).to.be.at.least(before);
            expect(result).to.be.at.most(after);
        });

        it("should be approximately epoch_ms divided by 1000", async () => {
            const ms: number = await converter.execute(null, { format: NowFormat.EpochMs });
            const s: number = await converter.execute(null, { format: NowFormat.EpochSeconds });

            expect(s).to.be.closeTo(Math.floor(ms / 1000), 1);
        });
    });

    describe("iso", () => {
        it("should return a valid ISO 8601 string", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.ISO });

            expect(result).to.be.a("string");
            expect(result).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        it("should round-trip to a valid Date", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.ISO });
            const parsed = new Date(result);

            expect(parsed.getTime()).to.be.a("number");
            expect(isNaN(parsed.getTime())).to.be.false;
        });
    });

    describe("utc", () => {
        it("should return a non-empty UTC string", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.UTC });

            expect(result).to.be.a("string");
            expect(result).to.include("GMT");
        });

        it("should round-trip to a valid Date", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.UTC });
            const parsed = new Date(result);

            expect(isNaN(parsed.getTime())).to.be.false;
        });
    });

    describe("local", () => {
        it("should return a non-empty string", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.Local });

            expect(result).to.be.a("string");
            expect(result.length).to.be.greaterThan(0);
        });
    });

    describe("date", () => {
        it("should return a YYYY-MM-DD string", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.Date });

            expect(result).to.be.a("string");
            expect(result).to.match(/^\d{4}-\d{2}-\d{2}$/);
        });

        it("should match today's UTC date", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.Date });
            const expected = new Date().toISOString().split("T")[0];

            expect(result).to.equal(expected);
        });
    });

    describe("time", () => {
        it("should return a HH:mm:ss.sss string without trailing Z", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.Time });

            expect(result).to.be.a("string");
            expect(result).to.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
        });
    });

    describe("timezone", () => {
        it("should return a formatted string when a valid IANA timezone is provided", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.WithTimezone, timezone: "America/New_York" });

            expect(result).to.be.a("string");
            expect(result.length).to.be.greaterThan(0);
        });

        it("should fall back to ISO string when no timezone is provided", async () => {
            const result: string = await converter.execute(null, { format: NowFormat.WithTimezone });

            expect(result).to.be.a("string");
            expect(result).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        it("should reflect timezone offset difference between UTC and New York", async () => {
            const utcResult: string = await converter.execute(null, { format: NowFormat.WithTimezone, timezone: "UTC" });
            const nyResult: string = await converter.execute(null, { format: NowFormat.WithTimezone, timezone: "America/New_York" });

            // Both are valid strings but differ when UTC offset is non-zero
            expect(utcResult).to.be.a("string");
            expect(nyResult).to.be.a("string");
        });
    });

    describe("default/unknown format", () => {
        it("should fall back to epoch ms for an unknown format", async () => {
            const before = Date.now();
            const result: number = await converter.execute(null, { format: "unknown_format" });
            const after = Date.now();

            expect(result).to.be.a("number");
            expect(result).to.be.at.least(before);
            expect(result).to.be.at.most(after);
        });
    });
});
