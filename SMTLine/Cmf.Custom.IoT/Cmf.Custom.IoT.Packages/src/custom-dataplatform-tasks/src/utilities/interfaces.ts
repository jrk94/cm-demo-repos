
export interface Data {
    Class: string,
    Name: string,
    NumericValues: number[],
    Timestamps: string[],
    UnitOfMeasure: string
}

export interface PostTelemetry {
    Parameters: Data[],
    Tags?: { Key: string, Value: string }[],
    Material?: { Name: string },
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

export interface Reading {
    SubZone: string;
    ReadingType: string;
    ReadingValue: number;
}

export interface Setpoint {
    SubZone: string;
    SetpointType: string;
    Setpoint: number;
}

export interface OvenData {
    Zone: {
        ReflowZoneType: string;
        StageSequence: number;
        StageName: string;
        StageType: string;
    };
    Setpoints: Setpoint[];
    Readings: Reading[];
}