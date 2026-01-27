import "reflect-metadata";
import * as chai from "chai";

import {
    buildCesmiiMessage,
    buildCesmiiSchema,
    buildCesmiiSchemaLegacy
} from "../../../../src/cesmii";

/** Helper to wrap a JSON Schema object into an iotSchema with a Schema string */
const makeIotSchema = (jsonSchema: any) => ({
    Schema: JSON.stringify(jsonSchema)
});

describe("buildCesmiiSchema (standard JSON Schema 2020-12)", () => {

    it("should return null when iotSchema is null or has no Schema", () => {
        chai.expect(buildCesmiiSchema(null)).to.be.null;
        chai.expect(buildCesmiiSchema({})).to.be.null;
    });

    it("should return a standard JSON Schema with $schema, $id, type, properties", () => {
        const iotSchema = makeIotSchema({
            $schema: "http://json-schema.org/draft-04/schema#",
            type: "object",
            properties: {
                Name: { type: "string" }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;
        chai.expect(result).to.have.property("$schema");
        chai.expect(result).to.have.property("$id");
        chai.expect(result).to.have.property("type", "object");
        chai.expect(result).to.have.property("properties");
        chai.expect(result.$schema).to.equal("https://json-schema.org/draft/2020-12/schema");
        // Should NOT have the old bundle format keys
        chai.expect(result).to.not.have.property("files");
        chai.expect(result).to.not.have.property("rootId");
    });

    it("should convert PascalCase property names to lowerCamelCase", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            required: ["Header", "Enterprise"],
            properties: {
                Header: { $ref: "#/definitions/Header" },
                Enterprise: { $ref: "#/definitions/Enterprise" }
            },
            definitions: {
                Header: {
                    type: "object",
                    required: ["CorrelationId"],
                    properties: {
                        CorrelationId: { type: "string" },
                        StartDateTime: { type: "string" }
                    }
                },
                Enterprise: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        DisplayOrder: { type: "integer" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        // Root properties should be lowerCamelCase
        chai.expect(result.properties).to.have.property("header");
        chai.expect(result.properties).to.have.property("enterprise");
        chai.expect(result.required).to.include("header");
        chai.expect(result.required).to.include("enterprise");

        // $defs properties should be lowerCamelCase
        chai.expect(result.$defs.header.properties).to.have.property("correlationId");
        chai.expect(result.$defs.header.properties).to.have.property("startDateTime");
        chai.expect(result.$defs.header.required).to.include("correlationId");

        // UID should become uid (not uID)
        chai.expect(result.$defs.enterprise.properties).to.have.property("uid");
    });

    it("should inline definitions into $defs", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" },
                Enterprise: { $ref: "#/definitions/Enterprise" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                },
                Enterprise: {
                    type: "object",
                    properties: {
                        UID: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$defs).to.have.property("header");
        chai.expect(result.$defs).to.have.property("enterprise");
        chai.expect(result.$defs.header.title).to.equal("Header");
        chai.expect(result.$defs.enterprise.title).to.equal("Enterprise");
    });

    it("should rewrite $ref to point to #/$defs/", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.properties.header.$ref).to.equal("#/$defs/header");
    });

    it("should inline nested definitions (Calendar/Shift) into $defs", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Calendar: { $ref: "#/definitions/Calendar" }
            },
            definitions: {
                Calendar: {
                    type: "object",
                    properties: {
                        Timezone: { type: "string" },
                        Shift: { $ref: "#/definitions/Calendar/definitions/Shift" }
                    },
                    definitions: {
                        Shift: {
                            type: "object",
                            required: ["Name", "StartTime"],
                            properties: {
                                Name: { type: "string" },
                                StartTime: { type: "string", format: "date-time" }
                            }
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$defs).to.have.property("calendar");
        chai.expect(result.$defs).to.have.property("calendarShift");

        chai.expect(result.$defs.calendarShift.properties).to.have.property("name");
        chai.expect(result.$defs.calendarShift.properties).to.have.property("startTime");
        chai.expect(result.$defs.calendarShift.required).to.include("name");
        chai.expect(result.$defs.calendarShift.required).to.include("startTime");

        chai.expect(result.$defs.calendar.properties.shift.$ref).to.equal("#/$defs/calendarShift");
    });

    it("should inline Previous nested definitions into $defs", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Previous: { $ref: "#/definitions/Previous" }
            },
            definitions: {
                Previous: {
                    type: "object",
                    properties: {
                        Step: { $ref: "#/definitions/Previous/definitions/Step" },
                        Material: { $ref: "#/definitions/Previous/definitions/Material" }
                    },
                    definitions: {
                        Step: {
                            type: "object",
                            properties: {
                                UID: { type: "string" }
                            }
                        },
                        Material: {
                            type: "object",
                            properties: {
                                PrimaryQty: { type: "number" }
                            }
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$defs).to.have.property("previous");
        chai.expect(result.$defs).to.have.property("previousStep");
        chai.expect(result.$defs).to.have.property("previousMaterial");

        chai.expect(result.$defs.previous.properties.step.$ref).to.equal("#/$defs/previousStep");
        chai.expect(result.$defs.previous.properties.material.$ref).to.equal("#/$defs/previousMaterial");
    });

    it("should add additionalProperties: false on all object schemas", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.additionalProperties).to.equal(false);
        chai.expect(result.$defs.header.additionalProperties).to.equal(false);
    });

    it("should inline Tools array into $defs/tools and $defs/toolItem", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Tools: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["UID"],
                        properties: {
                            UID: { type: "string" },
                            Name: { type: "string" },
                            Position: { type: "integer" }
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$defs).to.have.property("tools");
        chai.expect(result.$defs).to.have.property("toolItem");

        chai.expect(result.$defs.tools.type).to.equal("array");
        chai.expect(result.$defs.tools.items.$ref).to.equal("#/$defs/toolItem");

        chai.expect(result.$defs.toolItem.properties).to.have.property("uid");
        chai.expect(result.$defs.toolItem.properties).to.have.property("name");
        chai.expect(result.$defs.toolItem.properties).to.have.property("position");
        chai.expect(result.$defs.toolItem.required).to.include("uid");
        chai.expect(result.$defs.toolItem.additionalProperties).to.equal(false);

        chai.expect(result.properties.tools.$ref).to.equal("#/$defs/tools");
    });

    it("should remove named capture groups from patterns when format: date-time exists", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        DateTime: {
                            type: "string",
                            format: "date-time",
                            pattern: "^(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})T.*$"
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        // Pattern should be removed when format: date-time exists
        chai.expect(result.$defs.header.properties.dateTime).to.not.have.property("pattern");
        chai.expect(result.$defs.header.properties.dateTime.format).to.equal("date-time");
    });

    it("should use JSON Schema 2020-12", () => {
        const iotSchema = makeIotSchema({
            $schema: "http://json-schema.org/draft-04/schema#",
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$schema).to.equal("https://json-schema.org/draft/2020-12/schema");
    });

    it("should generate $id URL using options", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Name: { type: "string" }
            }
        });
        const result = buildCesmiiSchema(iotSchema, undefined, undefined, {
            baseNamespace: "https://mycompany.com/profiles",
            packageName: "my-package",
            version: "2.0.0"
        })!;

        chai.expect(result.$id).to.equal("https://mycompany.com/profiles/my-package/2.0.0");
    });

    it("should include examples array", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            required: ["Header"],
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result).to.have.property("examples");
        chai.expect(result.examples).to.be.an("array");
        chai.expect(result.examples.length).to.be.greaterThan(0);
    });

    it("should convert CDMVersion to cdmVersion (proper acronym handling)", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    required: ["CDMVersion"],
                    properties: {
                        CDMVersion: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$defs.header.properties).to.have.property("cdmVersion");
        chai.expect(result.$defs.header.required).to.include("cdmVersion");
    });

    it("should use criticalmanufacturing.com namespace by default", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Name: { type: "string" }
            }
        });
        const result = buildCesmiiSchema(iotSchema)!;

        chai.expect(result.$id).to.include("schemas.criticalmanufacturing.com");
    });
});

describe("buildCesmiiSchemaLegacy", () => {

    it("should return null when iotSchema is null or has no Schema", () => {
        chai.expect(buildCesmiiSchemaLegacy(null)).to.be.null;
        chai.expect(buildCesmiiSchemaLegacy({})).to.be.null;
    });

    it("should return single schema with additionalProperties: false enforced", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" }
                    }
                }
            }
        });
        const result = buildCesmiiSchemaLegacy(iotSchema)!;

        chai.expect(result.additionalProperties).to.equal(false);
        chai.expect(result.definitions.Header.additionalProperties).to.equal(false);
    });

    it("should add additionalProperties: false on nested definitions", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Previous: { $ref: "#/definitions/Previous" }
            },
            definitions: {
                Previous: {
                    type: "object",
                    properties: {
                        Step: { $ref: "#/definitions/Previous/definitions/Step" }
                    },
                    definitions: {
                        Step: {
                            type: "object",
                            properties: {
                                UID: { type: "string" }
                            }
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchemaLegacy(iotSchema)!;

        chai.expect(result.definitions.Previous.additionalProperties).to.equal(false);
        chai.expect(result.definitions.Previous.definitions.Step.additionalProperties).to.equal(false);
    });

    it("should add additionalProperties: false on array item objects", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Tools: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            UID: { type: "string" },
                            Name: { type: "string" }
                        }
                    }
                }
            }
        });
        const result = buildCesmiiSchemaLegacy(iotSchema)!;
        chai.expect(result.properties.Tools.items.additionalProperties).to.equal(false);
    });
});

describe("buildCesmiiMessage", () => {

    it("should return null when iotSchema is null or has no Schema, or rawData is null", () => {
        chai.expect(buildCesmiiMessage(null, {})).to.be.null;
        chai.expect(buildCesmiiMessage({}, {})).to.be.null;
        chai.expect(buildCesmiiMessage(makeIotSchema({}), null)).to.be.null;
    });

    it("should include $namespace from JSON Schema $id", () => {
        const iotSchema = makeIotSchema({
            $id: "https://example.com/my-profile/v1.0",
            type: "object",
            properties: {
                Name: { type: "string" }
            }
        });
        const result = buildCesmiiMessage(iotSchema, { Name: "Test" })!;
        chai.expect(result.$namespace).to.equal("https://example.com/my-profile/v1.0");
        chai.expect(result.Name).to.equal("Test");
    });

    it("should omit $namespace when JSON Schema has no $id", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Name: { type: "string" }
            }
        });
        const result = buildCesmiiMessage(iotSchema, { Name: "Test" })!;
        chai.expect(result).to.not.have.property("$namespace");
        chai.expect(result.Name).to.equal("Test");
    });

    it("should extract only schema-defined properties, excluding extras", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                UID: { type: "string" },
                Name: { type: "string" },
                DisplayOrder: { type: "integer" }
            }
        });
        const rawData = {
            UID: "123",
            Name: "TestEnterprise",
            DisplayOrder: 1,
            AdditionalProperties: null,
            ExtraField: "should be excluded"
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({
            UID: "123",
            Name: "TestEnterprise",
            DisplayOrder: 1
        });
    });

    it("should skip null and undefined values", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                UID: { type: "string" },
                Name: { type: "string" },
                Description: { type: "string" }
            }
        });
        const rawData = {
            UID: "123",
            Name: null,
            Description: undefined
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({ UID: "123" });
    });

    it("should resolve $ref to definitions for nested objects and filter properties", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Header: { $ref: "#/definitions/Header" },
                Enterprise: { $ref: "#/definitions/Enterprise" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" },
                        Operation: { type: "string" }
                    }
                },
                Enterprise: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" }
                    }
                }
            }
        });
        const rawData = {
            Header: {
                CorrelationId: "abc-123",
                Operation: "Post",
                Service: "SomeService",
                DateTime: "2026-01-01"
            },
            Enterprise: {
                UID: "ent-001",
                Name: "TestEnterprise",
                AdditionalProperties: null
            }
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({
            Header: {
                CorrelationId: "abc-123",
                Operation: "Post"
            },
            Enterprise: {
                UID: "ent-001",
                Name: "TestEnterprise"
            }
        });
    });

    it("should handle primitive array properties", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                DataGroupRefs: { type: "array", items: { type: "string" } },
                Tags: { type: "array", items: { type: "string" } }
            }
        });
        const rawData = {
            DataGroupRefs: ["ref1", "ref2"],
            Tags: ["tag1"]
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({
            DataGroupRefs: ["ref1", "ref2"],
            Tags: ["tag1"]
        });
    });

    it("should filter array of objects by item schema properties", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Tools: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            UID: { type: "string" },
                            Name: { type: "string" }
                        }
                    }
                }
            }
        });
        const rawData = {
            Tools: [
                { UID: "t1", Name: "Tool1", Extra: "ignored" },
                { UID: "t2", Name: "Tool2", Extra: "ignored" }
            ]
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({
            Tools: [
                { UID: "t1", Name: "Tool1" },
                { UID: "t2", Name: "Tool2" }
            ]
        });
    });

    it("should handle deeply nested $ref definitions (Previous with sub-objects)", () => {
        const iotSchema = makeIotSchema({
            type: "object",
            properties: {
                Previous: { $ref: "#/definitions/Previous" }
            },
            definitions: {
                Previous: {
                    type: "object",
                    properties: {
                        Step: { $ref: "#/definitions/Previous/definitions/Step" },
                        Material: { $ref: "#/definitions/Previous/definitions/Material" }
                    },
                    definitions: {
                        Step: {
                            type: "object",
                            properties: {
                                UID: { type: "string" },
                                Name: { type: "string" }
                            }
                        },
                        Material: {
                            type: "object",
                            properties: {
                                PrimaryQty: { type: "number" },
                                Form: { type: "string" }
                            }
                        }
                    }
                }
            }
        });
        const rawData = {
            Previous: {
                Step: { UID: "s1", Name: "StepA", AdditionalProperties: null },
                Material: { PrimaryQty: 3.0, Form: "Lot", FlowPath: "excluded" },
                Area: { Name: "ShouldBeExcluded" }
            }
        };
        const result = buildCesmiiMessage(iotSchema, rawData);
        chai.expect(result).to.deep.equal({
            Previous: {
                Step: { UID: "s1", Name: "StepA" },
                Material: { PrimaryQty: 3.0, Form: "Lot" }
            }
        });
    });

    it("should build message from full CDM event definition IoTSchema", () => {
        const iotSchema = makeIotSchema({
            $schema: "http://json-schema.org/draft-04/schema#",
            type: "object",
            required: ["Header", "Enterprise", "Site", "Facility"],
            properties: {
                Header: { $ref: "#/definitions/Header" },
                Enterprise: { $ref: "#/definitions/Enterprise" },
                Site: { $ref: "#/definitions/Site" },
                Facility: { $ref: "#/definitions/Facility" },
                Area: { $ref: "#/definitions/Area" },
                Resource: { $ref: "#/definitions/Resource" },
                Material: { $ref: "#/definitions/Material" }
            },
            definitions: {
                Header: {
                    type: "object",
                    properties: {
                        CorrelationId: { type: "string" },
                        Operation: { type: "string" },
                        DateTime: { type: "string", format: "date-time" },
                        StartDateTime: { type: "string", format: "date-time" },
                        Application: { type: "string" },
                        CDMVersion: { type: "string" },
                        Service: { type: "string" },
                        DataGroupRefs: { type: "array", items: { type: "string" } },
                        DataGroups: { type: "array", items: { type: "string" } }
                    }
                },
                Enterprise: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        DisplayOrder: { type: "integer" }
                    }
                },
                Site: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        DisplayOrder: { type: "integer" }
                    }
                },
                Facility: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        DisplayOrder: { type: "integer" }
                    }
                },
                Area: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        Type: { type: "string" }
                    }
                },
                Resource: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        Model: { type: "string" }
                    }
                },
                Material: {
                    type: "object",
                    properties: {
                        UID: { type: "string" },
                        Name: { type: "string" },
                        Type: { type: "string" }
                    }
                }
            }
        });
        const rawData = {
            "Header": {
                "CorrelationId": "2602030000000002829",
                "DateTime": "2026-02-03T18:56:28.083",
                "Application": "CDMBuilder",
                "Service": "PostDataCollectionPoints",
                "Operation": "Post",
                "CDMVersion": "11.2.0",
                "StartDateTime": "2026-02-03T18:56:25.260"
            },
            "Enterprise": {
                "UID": "2601301526490000002",
                "Name": "MachineMakers",
                "AdditionalProperties": null
            },
            "Site": {
                "UID": "2601301526490000002",
                "Name": "Europe-West",
                "AdditionalProperties": null
            },
            "Facility": {
                "UID": "2601301526490000001",
                "Name": "Production InduTech",
                "AdditionalProperties": null
            },
            "Area": {
                "UID": "2601301526490000002",
                "Name": "Fabrication",
                "AdditionalProperties": null
            }
        };

        const result = buildCesmiiMessage(iotSchema, rawData)!;

        chai.expect(result.Header).to.deep.equal({
            CorrelationId: "2602030000000002829",
            DateTime: "2026-02-03T18:56:28.083",
            Application: "CDMBuilder",
            Service: "PostDataCollectionPoints",
            Operation: "Post",
            CDMVersion: "11.2.0",
            StartDateTime: "2026-02-03T18:56:25.260"
        });

        chai.expect(result.Enterprise).to.deep.equal({
            UID: "2601301526490000002",
            Name: "MachineMakers"
        });

        chai.expect(result.Site).to.deep.equal({
            UID: "2601301526490000002",
            Name: "Europe-West"
        });

        chai.expect(result.Facility).to.deep.equal({
            UID: "2601301526490000001",
            Name: "Production InduTech"
        });

        chai.expect(result.Area).to.deep.equal({
            UID: "2601301526490000002",
            Name: "Fabrication"
        });

        chai.expect(result).to.not.have.property("Resource");
        chai.expect(result).to.not.have.property("Material");
    });
});
