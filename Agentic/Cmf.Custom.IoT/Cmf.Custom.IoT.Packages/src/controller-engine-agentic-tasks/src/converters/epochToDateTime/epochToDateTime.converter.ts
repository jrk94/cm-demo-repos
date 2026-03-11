import { Converter } from "@criticalmanufacturing/connect-iot-controller-engine";

/**
 * @whatItDoes
 *
 * >>TODO: Add description
 *
 */
@Converter.Converter({
    name: "epochToDateTime",
    input: "any",
    output: "string",
    parameters: {
    },
})
export class EpochToDateTimeConverter implements Converter.ConverterInstance<string | number, Date> {

    /**
     * Converts an epoch timestamp (string or number) to a Date object.
     * @param value epoch timestamp as a string or number (milliseconds since Unix epoch)
     * @param parameters Transformation parameters
     */
    transform(value: string | number, _parameters: { [key: string]: any; }): Date {

        const epoch = typeof value === "string" ? Number(value) : value;

        if (isNaN(epoch)) {
            throw new Error(`Invalid epoch value: ${value}`);
        }

        return new Date(epoch);

    }
}
