import { Converter, DI, Dependencies, TYPES } from "@criticalmanufacturing/connect-iot-controller-engine";

/**
 * @whatItDoes
 *
 * >>TODO: Add description
 *
 */
@Converter.Converter()
export class SomethingToSomethingConverter implements Converter.ConverterInstance <string, string> {

    @DI.Inject(TYPES.Dependencies.Logger)
    private _logger: Dependencies.Logger;

    /**
     * >>TODO: Enter description here!
     * @param value string value
     * @param parameters Transformation parameters
     */
    transform(value: string, parameters: { [key: string]: any; }): string {

        // >>TODO: Add converter code
        this._logger.error("The code for the converter was not yet developed");
        throw new Error(">>TODO: Not implemented yet");

    }
}
