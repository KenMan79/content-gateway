/**
 * Contains metatata about a schema that
 * can be used to uniquelly identify it.
 */
export type SchemaInfo = {
    namespace: string;
    name: string;
    version: string;
};

export const schemaInfoToKey = ({ namespace, name, version }: SchemaInfo) =>
    `${namespace}.${name}.${version}`;