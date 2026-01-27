/**
 * CESMII SM Profile Schema Builder
 *
 * Transforms legacy CDM-style JSON Schema (draft-04) into CESMII ProveIt-SMProfiles
 * compliant multi-file schema packages (JSON Schema 2020-12).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CesmiiBuildOptions {
    baseNamespace?: string;
    packageName?: string;
    version?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NAMESPACE = "https://schemas.criticalmanufacturing.com/smprofiles";
const DEFAULT_PACKAGE = "cdm-envelope";
const DEFAULT_VERSION = "1.0.0";
const JSON_SCHEMA_2020_12 = "https://json-schema.org/draft/2020-12/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Casing Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PascalCase → lowerCamelCase with proper acronym handling.
 * - "UID" → "uid"
 * - "CDMVersion" → "cdmVersion"
 * - "Header" → "header"
 * - "MyProperty" → "myProperty"
 */
function toLowerCamel(s: string): string {
    if (!s) {return s;}
    // Find leading uppercase sequence
    const match = s.match(/^([A-Z]+)(.*)$/);
    if (!match) {return s;}
    const [, upper, rest] = match;
    if (upper.length === 1) {
        // Single uppercase letter: "Header" → "header"
        return upper.toLowerCase() + rest;
    }
    if (rest.length === 0) {
        // All uppercase: "UID" → "uid"
        return upper.toLowerCase();
    }
    // Acronym followed by more: "CDMVersion" → "cdmVersion"
    // Keep last letter of acronym as start of next word
    return upper.slice(0, -1).toLowerCase() + upper.slice(-1) + rest;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Transformation
// ─────────────────────────────────────────────────────────────────────────────

/** Transform properties object, converting keys to lowerCamelCase */
function transformProperties(
    props: Record<string, any>,
    refMap: Map<string, string>
): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(props)) {
        out[toLowerCamel(key)] = transformSchemaNode(val, refMap);
    }
    return out;
}

/** Recursively transform a schema node */
function transformSchemaNode(schema: any, refMap: Map<string, string>): any {
    if (!schema || typeof schema !== "object") {return schema;}

    const result: any = {};

    for (const [k, v] of Object.entries(schema)) {
        if (k === "$ref" && typeof v === "string") {
            result["$ref"] = refMap.get(v) ?? v;
        } else if (k === "properties" && typeof v === "object") {
            result.properties = transformProperties(v as Record<string, any>, refMap);
        } else if (k === "required" && Array.isArray(v)) {
            result.required = (v as string[]).map((r) => toLowerCamel(r));
        } else if (k === "items" && typeof v === "object") {
            result.items = transformSchemaNode(v, refMap);
        } else if (k === "pattern") {
            // Remove named capture groups; skip if format: date-time exists
            if (schema.format === "date-time") {
                continue;
            }
            result.pattern = (v as string).replace(/\(\?<[^>]+>/g, "(?:");
        } else if (k === "definitions" || k === "$defs" || k === "$schema") {
            continue;
        } else {
            result[k] = v;
        }
    }

    // Enforce additionalProperties: false for objects
    if (result.type === "object" || result.properties) {
        if (!("additionalProperties" in result)) {
            result.additionalProperties = false;
        }
    }

    return result;
}

/** Recursively enforce additionalProperties: false on all object schemas */
function enforceAdditionalPropertiesFalse(schema: any): void {
    if (!schema || typeof schema !== "object") {
        return;
    }

    if (schema.type === "object" || schema.properties) {
        schema.additionalProperties = false;
    }

    if (schema.properties) {
        for (const propDef of Object.values(schema.properties as Record<string, any>)) {
            enforceAdditionalPropertiesFalse(propDef);
        }
    }

    if (schema.definitions) {
        for (const def of Object.values(schema.definitions as Record<string, any>)) {
            enforceAdditionalPropertiesFalse(def);
        }
    }

    if (schema.$defs) {
        for (const def of Object.values(schema.$defs as Record<string, any>)) {
            enforceAdditionalPropertiesFalse(def);
        }
    }

    if (schema.items && typeof schema.items === "object") {
        enforceAdditionalPropertiesFalse(schema.items);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Example Builder
// ─────────────────────────────────────────────────────────────────────────────

/** Build minimal example for root required fields */
function buildMinimalExample(required: string[]): Record<string, any> {
    const placeholders: Record<string, any> = {
        header: {
            correlationId: "example-id",
            operation: "TrackIn",
            dateTime: "2026-02-13T10:00:00Z",
            startDateTime: "2026-02-13T09:55:00Z",
            application: "MES",
            cdmVersion: "1.0.0",
        },
        enterprise: { uid: "ent-1", name: "Example Enterprise" },
        site: { uid: "site-1", name: "Example Site" },
        facility: { uid: "fac-1", name: "Example Facility" },
        material: {
            uid: "mat-1", name: "Lot001",
            createdOn: "2026-01-01T00:00:00Z", createdBy: "system",
            modifiedOn: "2026-02-13T09:00:00Z", modifiedBy: "operator",
            type: "Lot", dateEnteredStep: "2026-02-13T09:00:00Z",
            form: "Wafer", flowPath: "Flow1/Step1",
            primaryQty: 25, primaryUnits: "wafers",
        },
        area: { uid: "area-1", name: "Litho" },
        flow: { uid: "flow-1", name: "MainFlow" },
        step: { uid: "step-1", name: "Expose" },
        product: { uid: "prod-1", name: "ChipX" },
    };
    const example: Record<string, any> = {};
    for (const prop of required) {
        example[prop] = placeholders[prop] ?? { uid: "placeholder", name: "placeholder" };
    }
    return example;
}

// ─────────────────────────────────────────────────────────────────────────────
// $ref Resolution
// ─────────────────────────────────────────────────────────────────────────────

function resolveRef(rootSchema: any, ref: string): any {
    const path = ref.replace(/^#\//, "").split("/");
    let current = rootSchema;
    for (const segment of path) {
        current = current?.[segment];
    }
    return current ?? {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a standard JSON Schema 2020-12 document from an IoTSchema.
 * Transforms legacy draft-04 schema into JSON Schema 2020-12 compliant
 * single-document schema with embedded $defs:
 * - Converts PascalCase to lowerCamelCase (including UID→uid, CDMVersion→cdmVersion)
 * - Inlines definitions into $defs
 * - Rewrites $ref from #/definitions/X to #/$defs/x
 * - Removes named capture groups from patterns
 * - Enforces additionalProperties: false
 * - Generates stable $id URL
 */
export function buildCesmiiSchema(
    iotSchema: any,
    titlePost: string = "CDM Envelope",
    description: string = "CDM Envelope schema with embedded definitions.",
    options: CesmiiBuildOptions = {}
): Record<string, any> | null {
    if (!iotSchema?.Schema) {
        return null;
    }

    const legacySchema = JSON.parse(iotSchema.Schema);
    const ns = options.baseNamespace ?? DEFAULT_NAMESPACE;
    const pkg = options.packageName ?? DEFAULT_PACKAGE;
    const ver = options.version ?? DEFAULT_VERSION;
    const schemaId = `${ns}/${pkg}/${ver}`;

    const $defs: Record<string, any> = {};
    const refMap = new Map<string, string>();
    const definitions = legacySchema.definitions ?? {};

    // First pass: collect all definitions and build ref map (legacy ref → $defs ref)
    const defEntries: { key: string; def: any; defsKey: string; legacyRef: string }[] = [];

    for (const [defKey, defVal] of Object.entries(definitions)) {
        const defsKey = toLowerCamel(defKey);
        const legacyRef = `#/definitions/${defKey}`;
        defEntries.push({ key: defKey, def: defVal, defsKey, legacyRef });
        refMap.set(legacyRef, `#/$defs/${defsKey}`);

        // Extract nested definitions (e.g., Calendar/definitions/Shift)
        const nestedDefs = (defVal as any).definitions ?? (defVal as any).$defs;
        if (nestedDefs) {
            for (const [nestedKey, nestedSchema] of Object.entries(nestedDefs)) {
                const nestedDefsKey = `${defsKey}${nestedKey}`;
                const nestedLegacyRef = `#/definitions/${defKey}/definitions/${nestedKey}`;
                refMap.set(nestedLegacyRef, `#/$defs/${nestedDefsKey}`);
                defEntries.push({
                    key: `${defKey}/${nestedKey}`,
                    def: nestedSchema,
                    defsKey: nestedDefsKey,
                    legacyRef: nestedLegacyRef,
                });
            }
        }
    }

    // Transform and add each definition to $defs
    for (const { key, def, defsKey } of defEntries) {
        const defCopy = JSON.parse(JSON.stringify(def));
        delete defCopy.definitions;
        delete defCopy.$defs;

        const transformed = transformSchemaNode(defCopy, refMap);
        const title = key.includes("/") ? key.split("/").pop()! : key;

        $defs[defsKey] = {
            title: title,
            description: `${title} schema.`,
            ...transformed,
        };
    }

    // Handle inline Tools array (special case)
    const toolsProps = legacySchema.properties?.Tools;
    if (toolsProps?.type === "array" && toolsProps.items) {
        const itemSchema = transformSchemaNode(toolsProps.items, refMap);
        $defs["toolItem"] = {
            title: "ToolItem",
            description: "Individual tool item.",
            ...itemSchema,
        };
        $defs["tools"] = {
            title: "Tools",
            description: "Array of tool items.",
            type: "array",
            items: { $ref: "#/$defs/toolItem" },
        };
    }

    // Build root properties
    const rootProps: Record<string, any> = {};
    const legacyProps = legacySchema.properties ?? {};

    for (const [propKey, propVal] of Object.entries(legacyProps)) {
        const newKey = toLowerCamel(propKey);
        if (propKey === "Tools") {
            rootProps[newKey] = { $ref: "#/$defs/tools" };
        } else if ((propVal as any).$ref) {
            const oldRef = (propVal as any).$ref;
            rootProps[newKey] = { $ref: refMap.get(oldRef) ?? oldRef };
        } else {
            rootProps[newKey] = transformSchemaNode(propVal, refMap);
        }
    }

    const rootRequired = (legacySchema.required ?? []).map((r: string) => toLowerCamel(r));

    // Build the final standard JSON Schema 2020-12 document
    const result: Record<string, any> = {
        $schema: JSON_SCHEMA_2020_12,
        $id: schemaId,
        title: titlePost,
        description,
        type: "object",
        required: rootRequired,
        properties: rootProps,
        additionalProperties: false,
    };

    // Only add $defs if there are definitions
    if (Object.keys($defs).length > 0) {
        result.$defs = $defs;
    }

    // Add example
    result.examples = [buildMinimalExample(rootRequired)];

    return result;
}

/**
 * Legacy single-schema builder (backward compatibility).
 * Returns the root schema only with additionalProperties enforced.
 */
export function buildCesmiiSchemaLegacy(iotSchema: any): Record<string, any> | null {
    if (!iotSchema?.Schema) {
        return null;
    }
    const jsonSchema = JSON.parse(iotSchema.Schema);
    enforceAdditionalPropertiesFalse(jsonSchema);
    return jsonSchema;
}

/**
 * Builds a CESMII SM Profile message (payload instance) from an IoTSchema and raw data.
 * Parses the JSON Schema from iotSchema.Schema, resolves $ref definitions,
 * and filters rawData to only include schema-defined properties.
 * Adds $namespace from the JSON Schema $id when available.
 */
export function buildCesmiiMessage(iotSchema: any, rawData: any): Record<string, any> | null {
    if (!iotSchema?.Schema || !rawData) {
        return null;
    }

    const jsonSchema = JSON.parse(iotSchema.Schema);
    const message: Record<string, any> = {};

    if (jsonSchema.$id) {
        message.$namespace = jsonSchema.$id;
    }

    filterByJsonSchema(jsonSchema, jsonSchema, rawData, message);

    return message;
}

function filterByJsonSchema(
    rootSchema: any,
    schema: any,
    rawData: any,
    profile: Record<string, any>
): void {
    if (!schema.properties || !rawData) {
        return;
    }

    for (const [key, propDef] of Object.entries(schema.properties as Record<string, any>)) {
        const value = rawData[key];
        if (value === undefined || value === null) {
            continue;
        }

        const resolved = propDef.$ref
            ? resolveRef(rootSchema, propDef.$ref)
            : propDef;

        if (resolved.type === "object" && resolved.properties && typeof value === "object" && !Array.isArray(value)) {
            const nested: Record<string, any> = {};
            filterByJsonSchema(rootSchema, resolved, value, nested);
            if (Object.keys(nested).length > 0) {
                profile[key] = nested;
            }
        } else if (resolved.type === "array" && Array.isArray(value)) {
            if (resolved.items?.properties) {
                profile[key] = value.map((item: any) => {
                    const filtered: Record<string, any> = {};
                    filterByJsonSchema(rootSchema, resolved.items, item, filtered);
                    return filtered;
                });
            } else {
                profile[key] = value;
            }
        } else {
            profile[key] = value;
        }
    }
}
