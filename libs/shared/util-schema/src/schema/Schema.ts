/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    CodecValidationError,
    mapCodecValidationError,
    schemaCodec,
    SupportedJSONSchema,
} from "@shared/util-dto";
import { Type } from "@tsed/core";
import { getJsonSchema } from "@tsed/schema";
import Ajv from "ajv/dist/ajv";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as difftool from "json-schema-diff-validator";
import { SchemaValidationError } from ".";
import { SchemaInfo } from "..";

const ajv = new Ajv({
    allErrors: true,
    $data: true,
    verbose: true,
    validateFormats: true,
    messages: true,
});

export type ValidationError = {
    field: string;
    message: string;
};

/**
 * Represents a {@link Schema} in JSON form.
 */
export type SchemaJson = {
    info: SchemaInfo;
    jsonSchema: Record<string, unknown>;
};

/**
 * A Schema contains metadata about a specific type and functions
 * for validation and serialization. Note that all types will be
 * serialized from/to records, not types. Use type guards to ensure
 * you have the right type.
 */
export type Schema = {
    info: SchemaInfo;
    jsonSchema: SupportedJSONSchema;
    /**
     * Serializes this schema into a JSON string.
     */
    toJson(): SchemaJson;
    /**
     * Validates the given record against the schema.
     */
    validate: (
        data: Record<string, unknown>
    ) => E.Either<SchemaValidationError, Record<string, unknown>>;

    /**
     * Tells whether this schema has breaking changes compared to
     * the other schema.
     */
    // TODO: make this return errors
    isBackwardCompatibleWith: (other: Schema) => boolean;
};

/**
 * Creates a [[Schema]] object from the given [[type]]
 * and the given schema [[info]].
 * Note that this is a curried function and requireds a [[serializer]]
 * in order to work.
 */
export const createSchemaFromType: <T>(
    info: SchemaInfo,
    type: Type<T>
) => E.Either<CodecValidationError, Schema> = (info, type) => {
    return createSchemaFromObject({
        info: info,
        jsonSchema: getJsonSchema(type),
    });
};

/**
 * Creates a [[Schema]] object from the given JSON schema object
 * and the given schema [[info]].
 */
export const createSchemaFromObject = (
    schema: SchemaJson
): E.Either<CodecValidationError, Schema> => {
    if (schema.jsonSchema._id) {
        return E.left(new CodecValidationError("_id is a reserved field", []));
    }
    return pipe(
        E.Do,
        E.bind("validSchema", () => schemaCodec.decode(schema)),
        mapCodecValidationError("JSON Schema validation failed."),
        E.bind("validator", ({ validSchema }) =>
            E.right(ajv.compile(validSchema.jsonSchema))
        ),
        E.map(({ validSchema, validator }) => {
            return {
                info: validSchema.info,
                jsonSchema: validSchema.jsonSchema,
                toJson: () => {
                    return validSchema;
                },
                validate: (data: Record<string, unknown>) => {
                    const validationResult = validator(data);
                    if (validationResult) {
                        return E.right(data);
                    } else {
                        return E.left(
                            // ❗ Take a look at what is actually produced by ajv here
                            // TODO: took a look...how can we extract the field name?
                            new SchemaValidationError({
                                validationErrors:
                                    validator.errors?.map((err) =>
                                        err.instancePath
                                            ? `Field ${err.instancePath.substring(
                                                  1
                                              )} ${err.message}`
                                            : err.message
                                    ) ?? [],
                            })
                        );
                    }
                },
                isBackwardCompatibleWith: (other: Schema) => {
                    try {
                        difftool.validateSchemaCompatibility(
                            other.jsonSchema,
                            validSchema.jsonSchema,
                            {
                                allowNewEnumValue: true,
                                allowNewOneOf: true,
                                allowReorder: true,
                            }
                        );
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
            };
        })
    );
};
