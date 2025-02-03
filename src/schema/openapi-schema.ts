import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "./DeepReadonly";

export type OpenAPISchemaJSONSchema = JSONSchema7 & {
  discriminator?: {
    propertyName: string;
    mapping?: Record<string, string>;
  };
};

export type OpenAPIComponentDefinition = DeepReadonly<OpenAPISchemaJSONSchema>;

export type OpenAPIOperationParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema: OpenAPISchemaJSONSchema;
};

export type OpenAPIOperationHeader = {
  schema: OpenAPISchemaJSONSchema;
};

export type OpenAPIOperationRefResponse = {
  $ref?: string;
};

export type OpenAPIOperationDirectResponse = {
  description?: string;
  headers?: {
    [key: string]: OpenAPIOperationHeader;
  };
  content?: {
    "application/json"?: {
      schema: OpenAPISchemaJSONSchema;
    };
    "text/plain"?: {
      schema: {
        type: "string";
      };
    };
  };
};

export type OpenAPIOperationResponse =
  | OpenAPIOperationRefResponse
  | OpenAPIOperationDirectResponse;

export type OpenAPIOperation = {
  summary?: string;
  operationId: string;
  tags?: Readonly<Array<string>>;
  parameters?: Readonly<Array<OpenAPIOperationParameter>>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content: {
      "application/json": {
        schema: OpenAPISchemaJSONSchema;
      };
    };
  };
  responses: {
    [code: string]: Readonly<OpenAPIOperationResponse>;
  };
};

export type OpenAPIServer = {
  url: string;
  description?: string;
  variables?: { [key: string]: OpenAPIServerVariable };
};

export type OpenAPIServerVariable = {
  enum?: Array<string>;
  default: string;
  description?: string;
};

export type OpenAPIMethods = (
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch"
  | "all"
) &
  string;

export type OpenAPISchema = DeepReadonly<{
  openapi: string;
  info: {
    version: string;
    title: string;
  };
  servers?: Array<OpenAPIServer>;
  paths: {
    [key: string]: {
      [method: string]: OpenAPIOperation;
    };
  };
  components: {
    schemas?: {
      [name: string]: OpenAPISchemaJSONSchema;
    };
    responses?: {
      [name: string]: OpenAPIOperationDirectResponse;
    };
  };
}>;

export type EmptyOpenAPISchema = DeepReadonly<{
  openapi: "3.0.0";
  info: { version: "0.0.0"; title: "empty schema" };
  paths: { [key: string]: never };
  components: {
    schemas: { [name: string]: never };
  };
}>;
