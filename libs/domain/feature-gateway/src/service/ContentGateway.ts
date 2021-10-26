import { Schema } from "@shared/util-schema";
import * as TE from "fp-ts/TaskEither";
import { DataStorage, SchemaStorage } from "../adapter";
import { Payload } from "../types";

/**
 * Public API (facade) for the Content Gateway backend service that's responsible
 * for ingestion of data.
 */
export type ContentGateway = {
    /**
     * Registers a new schema shapshot with the Content Gateway.
     */
    register: (schema: Schema) => TE.TaskEither<Error, void>;
    /**
     * Ingests a new payload into the Content Gateway. The payload is validated
     * and it must correspond to a registered schema. If either the schema doesn't
     * exist or the payload is invalid according to the schema an error will be
     * returned.
     */
    receive: <T>(payload: Payload<T>) => TE.TaskEither<Error, string>;
};

export type ContentGatewayFactory = (
    schemaStorage: SchemaStorage,
    dataStorage: DataStorage
) => ContentGateway;

/**
 * Creates a new [[ContentGateway]] instance using the supplied
 * [[schemaStorage]] and [[dataStorage]].
 */
export const createContentGateway: ContentGatewayFactory = (
    schemaStorage: SchemaStorage,
    dataStorage: DataStorage
) => {
    return {
        register: (schema: Schema) => {
            return schemaStorage.register(schema);
        },
        receive: <T>(payload: Payload<T>) => {
            return dataStorage.store({
                info: payload.info,
                data: payload.data as Record<string, unknown>
            });
        },
    };
};