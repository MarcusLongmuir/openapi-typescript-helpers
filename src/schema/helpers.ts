import type { OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";







export type GetOperationById<
  S extends OpenAPISchema,
  Id extends string,
> = Extract<GetAllOperations<S>, { operationId: Id }>;









  T extends keyof S["components"]["schemas"],

  ? S["components"]["schemas"][T]




  T extends keyof S["components"]["schemas"],


export type ComponentDefinitionFromString<
  S extends OpenAPISchema,
  T extends string,
> = T extends keyof S["components"]["schemas"]
  ? ComponentDefinitionFromName<S, T>
  : never;
