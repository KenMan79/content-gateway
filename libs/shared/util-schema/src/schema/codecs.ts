import * as t from "io-ts";
import { withMessage } from "io-ts-types";

export const booleanPropertyCodec = withMessage(
    t.strict({
        type: t.literal("boolean"),
    }),
    (input) => `${JSON.stringify(input)} is not a valid boolean`
);

export type BooleanProperty = t.TypeOf<typeof booleanPropertyCodec>;

export const numberPropertyCodec = withMessage(
    t.strict({
        type: t.literal("number"),
    }),
    (input) => `${JSON.stringify(input)} is not a valid number`
);

export type NumberProperty = t.TypeOf<typeof numberPropertyCodec>;

export const stringPropertyCodec = withMessage(
    t.exact(
        t.intersection([
            t.type({ type: t.literal("string") }),
            t.partial({ minLength: t.number }),
        ])
    ),
    (input) => `${JSON.stringify(input)} is not a valid string`
);

export type StringProperty = t.TypeOf<typeof stringPropertyCodec>;

export const arrayPropertyCodec = withMessage(
    t.strict({
        type: t.literal("array"),
        items: t.strict({ type: t.literal("string") }),
    }),
    (input) => `${JSON.stringify(input)} is not a valid array property`
);

export type ArrayProperty = t.TypeOf<typeof arrayPropertyCodec>;

export const refPropertyCodec = withMessage(
    t.strict({
        $ref: t.string,
    }),
    (input) => `${JSON.stringify(input)} is not a valid reference`
);

export type RefProperty = t.TypeOf<typeof refPropertyCodec>;

export const arrayRefPropertyCodec = withMessage(
    t.strict({
        type: t.literal("array"),
        items: t.strict({ $ref: t.string }),
    }),
    (input) => `${JSON.stringify(input)} is not a valid array reference`
);

export type ArrayRefProperty = t.TypeOf<typeof arrayRefPropertyCodec>;

export const supportedPropertyCodec = withMessage(
    t.union([
        booleanPropertyCodec,
        numberPropertyCodec,
        stringPropertyCodec,
        arrayPropertyCodec,
        refPropertyCodec,
        arrayRefPropertyCodec,
    ]),
    (input) =>
        `${JSON.stringify(
            input
        )} property is not supported. Did you forget to add an annotation somewhere?`
);

export type SupportedProperty = t.TypeOf<typeof supportedPropertyCodec>;

export const supportedPropertyRecordCodec = t.record(
    t.string,
    supportedPropertyCodec
);

export type SupportedPropertyRecord = t.TypeOf<
    typeof supportedPropertyRecordCodec
>;

export const jsonSchemaTypeCodec = t.intersection([
    t.strict({
        type: withMessage(
            t.literal("object"),
            () => "A json schema type must have type of object"
        ),
        properties: supportedPropertyRecordCodec,
    }),
    t.exact(
        t.partial({
            required: withMessage(
                t.array(t.string),
                () => "The required field must be an array"
            ),
        })
    ),
]);

export type JSONSchemaType = t.TypeOf<typeof jsonSchemaTypeCodec>;

export const idPropertyCodec = withMessage(
    t.type({
        type: t.literal("string"),
        minLength: t.literal(1),
    }),
    (input) => `${input} is not a valid id`
);

export type IdProperty = t.TypeOf<typeof idPropertyCodec>;

const hasRequiredIdCodec = t.union([
    t.array(t.string),
    t.tuple([t.literal("id")]),
]);
type HasRequiredId = t.TypeOf<typeof hasRequiredIdCodec>;

// TODO: ⚠️ empty array shouldn't be allowed
const arr0: HasRequiredId = [];
const arr1: HasRequiredId = ["id"];
const arr2: HasRequiredId = ["id", "name"];

// 👇 note that we're not using exact/strict because this only tests whether the
// id field exists
export const hasIdCodec = withMessage(
    t.type({
        type: t.literal("object"),
        properties: t.type({
            id: idPropertyCodec,
        }),
        required: hasRequiredIdCodec,
    }),
    () => "The supplied object has no id property"
);

export type HasId = t.TypeOf<typeof hasIdCodec>;

export const supportedJSONSchemaCodec = t.intersection([
    withMessage(
        t.strict({
            additionalProperties: t.literal(false),
        }),
        () =>
            "A schema must have additional properties disabled. Did you add @AdditionalProperties(false)?"
    ),
    jsonSchemaTypeCodec,
    t.exact(
        t.partial({
            definitions: withMessage(
                t.record(t.string, jsonSchemaTypeCodec),
                () => "Definitions is not a valid json schema type record"
            ),
        })
    ),
]);

export type SupportedJSONSchema = t.TypeOf<typeof supportedJSONSchemaCodec>;

export const schemaInfoCodec = withMessage(
    t.strict({
        namespace: t.string,
        name: t.string,
        version: t.string,
    }),
    () => "Schema information is invalid"
);

export const schemaCodec = t.strict({
    info: schemaInfoCodec,
    jsonSchema: supportedJSONSchemaCodec,
});

export const payloadCodec = t.strict({
    info: schemaInfoCodec,
    data: withMessage(
        t.record(t.string, t.unknown),
        () => "Data is not a valid json object"
    ),
});

export const batchPayloadCodec = withMessage(
    t.strict({
        info: schemaInfoCodec,
        data: t.array(t.record(t.string, t.unknown)),
    }),
    () => "Payload is invalid"
);
