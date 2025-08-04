
export interface Data {
    Class: string,
    Name: string,
    NumericValues?: number[],
    StringValues?: number[],
    Timestamps: string[],
    UnitOfMeasure: string
}

export interface PostProjectTelemetry {
    Parameters: Data[],
    Tags?: { Key: string, Value: string }[],
    Project?: { Name: string },
    Package?: { Name: string, Version: string }
}
