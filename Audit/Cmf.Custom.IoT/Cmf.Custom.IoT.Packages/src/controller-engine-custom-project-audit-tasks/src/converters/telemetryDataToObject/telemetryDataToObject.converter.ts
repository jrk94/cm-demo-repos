import { Converter, DI, Dependencies, TYPES } from "@criticalmanufacturing/connect-iot-controller-engine";

/**
 * @whatItDoes
 *
 * >>TODO: Add description
 *
 */
@Converter.Converter({
    name: "telemetryDataToObject",
    input: "string",
    output: "object"
})
export class TelemetryDataToObjectConverter implements Converter.ConverterInstance<string, object> {

    @DI.Inject(TYPES.Dependencies.Logger)
    private _logger: Dependencies.Logger;

    /**
     * >>TODO: Enter description here!
     * @param value string value
     * @param parameters Transformation parameters
     */
    transform(value: string, parameters: { [key: string]: any; }): object {

        const rows = value.split("\n");
        const result = {};

        function camelize(str) {
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                return index === 0 ? word.toLowerCase() : word.toUpperCase();
            }).replace(/\s+/g, "");
        }

        // First Row is Header
        rows.splice(0, 1);
        for (const row of rows) {
            if (row !== "") {
                const elements = row.split(",");
                const title = camelize(elements[0]).trim();
                const values = elements[1].split(";");

                const valuesConverted = values.map(item => {
                    const num = Number(item);
                    return !isNaN(num) && item.trim() !== "" ? num : item.trim();
                });

                result[title] = valuesConverted;
            }
        }
        return result;
    }
}
