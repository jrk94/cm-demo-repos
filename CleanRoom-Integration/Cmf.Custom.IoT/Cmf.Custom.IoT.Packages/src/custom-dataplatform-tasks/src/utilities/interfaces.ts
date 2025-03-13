
export interface Data {
    Class: string,
    Name: string,
    NumericValues: number[],
    Timestamps: string[],
    UnitOfMeasure: string
}

export interface PostTelemetry {
    Parameters: Data[],
    Tags: object,
    Resource?: { Name: string },
    Area?: { Name: string },
    Facility?: { Name: string },
    Site?: { Name: string },
    Enterprise?: { Name: string },
}

export interface ISA95 {
    Resource?: string,
    Area?: string,
    Site?: string,
    Facility?: string,
    Enterprise?: string
}