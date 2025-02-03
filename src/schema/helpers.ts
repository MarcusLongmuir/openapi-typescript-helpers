import type { OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";

export type GetOperationByPathAndMethod<
  S extends OpenAPISchema,
  P extends keyof S["paths"],
  M extends keyof S["paths"][P],
> = S["paths"][P][M];

export type GetOperationById<
  S extends OpenAPISchema,
  Id extends string,
> = Extract<GetAllOperations<S>, { operationId: Id }>;

export type GetAllOperations<S extends OpenAPISchema> = {
  [P in keyof S["paths"]]: {
    [M in keyof S["paths"][P]]: GetOperationByPathAndMethod<S, P, M>;
  }[keyof S["paths"][P]];
}[keyof S["paths"]];

export type ComponentDefinitionFromName<
  S extends OpenAPISchema,
  T extends keyof S["components"]["schemas"],
> = S["components"]["schemas"] extends object
  ? S["components"]["schemas"][T]
  : never;

export type ComponentTypeFromName<
  S extends OpenAPISchema,
  T extends keyof S["components"]["schemas"],
> = ToValueType<S, ComponentDefinitionFromName<S, T>>;

export type ComponentDefinitionFromString<
  S extends OpenAPISchema,
  T extends string,
> = T extends keyof S["components"]["schemas"]
  ? ComponentDefinitionFromName<S, T>
  : never;
