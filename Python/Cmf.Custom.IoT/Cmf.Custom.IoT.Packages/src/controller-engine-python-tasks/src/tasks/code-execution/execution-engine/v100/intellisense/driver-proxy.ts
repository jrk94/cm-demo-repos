
export interface AutomationProtocolDataType {
    /** Data Type as known by the protocol */
    Name: string;
}

/** Representation of a property provided by the interface of the device */
export interface AutomationProperty {
    /** Id of the property */
    Id: string;
    /** Name of the property */
    Name: string;
    /** Description of the property */
    Description: string;
    /** Unique Id of the property as the interface knows it */
    DevicePropertyId: string;
    /**
     * Data type expected to represent the value
     *  String = 0,
     *  Date = 1,
     *  Time = 2,
     *  DateTime = 3,
     *  Decimal = 4,
     *  Integer = 5,
     *  Long = 6,
     *  Binary = 7,
     *  Boolean = 8,
     *  Object = 9
    */
    DataType: number;
    /** Data Type of the property in the equipment */
    AutomationProtocolDataType: AutomationProtocolDataType;
    /** Flag indicating if the property can be read */
    IsReadable: boolean;
    /** Flag indicating if the property can be written */
    IsWritable: boolean;
    /** JSON formatted extended data */
    ExtendedData: string;
}

/** Representation of an event provided by the interface of the device */
export interface AutomationEvent {
    /** Id of the event */
    Id: string;
    /** Name of the event */
    Name: string;
    /** Description of the event */
    Description: string;
    /** Unique Id of the event as the interface knows it */
    DeviceEventId: string;
    /** Flag indicating if the event is enabled */
    IsEnabled: boolean;
    /** JSON formatted extended data */
    ExtendedData: string;
}

/** Representation of a command parameter provided by the interface of the device */
export interface AutomationCommandParameter {
    /** Id of the command parameter */
    Id: string;
    /** Name of the command parameter */
    Name: string;
    /** Description of the command parameter */
    Description: string;
    /**
     * Data type expected to represent the value
     *  String = 0,
     *  Date = 1,
     *  Time = 2,
     *  DateTime = 3,
     *  Decimal = 4,
     *  Integer = 5,
     *  Long = 6,
     *  Binary = 7,
     *  Boolean = 8,
     *  Object = 9
    */
   DataType: number;
   /** Data Type of the property in the equipment */
   AutomationProtocolDataType: AutomationProtocolDataType;
   /** Flag indicating if the parameter is mandatory */
   IsMandatory: boolean;
   /** Order of the parameter in the command */
   Order: number;
   /** Default value of the command parameter */
   DefaultValue: string;
   /** JSON formatted extended data */
   ExtendedData: string;
}

/** Representation of a command provided by the interface of the device */
export interface AutomationCommand {
    /** Id of the command */
    Id: string;
    /** Name of the command */
    Name: string;
    /** Description of the command */
    Description: string;
    /** Unique Id of the command as the interface knows it */
    DeviceCommandId: string;
    /** JSON formatted extended data */
    ExtendedData: string;
    /** List of parameters of the command */
    Parameters: AutomationCommandParameter[];
}

/** Automation Protocol (driver) */
export interface AutomationProtocol {
    /** Id of the protocol */
    Id: string;
    /** Name of the protocol */
    Name: string;
    /** Version of the Protocol */
    Version: number;
    /** Type of protocol */
    Type: string;
    /** Package name associated with the protocol (npm package name) */
    Package: string;
    /** Version of the package (npm package version) */
    PackageVersion: string;
}

/** Link between an event and a property */
export interface AutomationEventProperty {
    /** Id of the link */
    Id: string;
    /** Name of the link */
    Name: string;
    /** Description of the link */
    Description: string;
    /** Order/index of the property in the event */
    Order: number;
    /** Automation Event of the link */
    AutomationEvent: AutomationEvent;
    /** Automation Property linked */
    AutomationProperty: AutomationProperty;
}

/** Driver Definitions (events, properties, commands, etc) */
export interface AutomationDriverDefinition {
    /** Id of the AutomationDriverDefinition */
    Id: string;
    /** Name of the AutomationDriverDefinition */
    Name: string;
    /** Description of the AutomationDriverDefinition */
    Description: string;
    /** Version of the AutomationDriverDefinition */
    Version: number;
    /** Type of AutomationDriverDefinition */
    Type: string;

    /** Automation Protocol Associated with the Driver Definition */
    AutomationProtocol: AutomationProtocol;

    /** List of Automation Properties associated with the Driver Definition */
    Properties: AutomationProperty[];
    /** List of Automation Events associated with the Driver Definition */
    Events: AutomationEvent[];
    /** List of links between events and properties */
    EventProperties: AutomationEventProperty[];
    /** List of available commands to send to device */
    Commands: AutomationCommand[];
}

/** The entire driver definitions assigned to this controller */
export interface AutomationControllerDriverDefinition {
    /** Id of the AutomationControllerDriverDefinition */
    Id: string;
    /** Name of the AutomationControllerDriverDefinition */
    Name: string;
    /** Display Name (Friendly Name) of the AutomationControllerDriverDefinition */
    DisplayName: string;

    /** Id if the controller associated with this driver definition version */
    AutomationControllerId: string;
    /** Driver Definitions associated with the task */
    AutomationDriverDefinition: AutomationDriverDefinition;
}

export interface EquipmentPropertyValue {
    property: AutomationProperty;
    value: any;
    originalValue: any;
}

export interface PropertyValue extends EquipmentPropertyValue {
    /** Identifier of the property (the name, which must be unique in the driver definition) */
    propertyName: string;
}

/**
 * Access to the driver interface (Protocol + Driver Definition)
 */
export interface DriverProxy {

    /**
     * Entire driver definition settings of the driver
     */
    readonly automationControllerDriverDefinition: AutomationControllerDriverDefinition;

    /**
     * Establish connection between the driver and the equipment
     */
    connect(): Promise<void>;

    /**
     * Disconnect the driver
     */
    disconnect(): Promise<void>;

    /**
     * Executes a command on the device.
     * @param command Command to execute
     * @param parameters Additional command information to send to the device
     */
    executeCommand(command: AutomationCommand, parameters: Map<string, any>): Promise<any>;

    /**
     * Gets the property values from the device.
     * @param properties Properties to retrieve
     * @return An array of property values (same order as the input property)
     */
    getProperties(properties: AutomationProperty[]): Promise<PropertyValue[]>;

    /**
     * Sets the given properties on the device
     * @param propertiesValues Property -> Value map
     */
    setProperties(propertiesValues: Map<AutomationProperty, any>): Promise<boolean>;

    /**
     * Send a direct message to the driver (and receive a reply)
     * @param type Message type (subject)
     * @param content Message content
     * @param timeout Number of milliseconds to wait until a timeout error is thrown
     */
    sendRaw(type: string, content: any, timeout?: number): Promise<any>;
     /**
     * Send a notification directly to the driver
     * @param type Message type (subject)
     * @param content Message content
     */
    notifyRaw(type: string, content: any): Promise<void>;
}
