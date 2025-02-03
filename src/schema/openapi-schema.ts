import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "./DeepReadonly";

export type OpenAPISchemaJSONSchema = JSONSchema7 & {
  discriminator?: {
    propertyName: string;
    mapping?: Record<string, string>;
  };
};

























    "application/json"?: {


    "text/plain"?: {
      schema: {
        type: "string";
      };
    };













    description?: string;


































































