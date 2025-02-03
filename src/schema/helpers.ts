import type { OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";




















  T extends keyof S["components"]["schemas"],

  ? S["components"]["schemas"][T]




  T extends keyof S["components"]["schemas"],


export type ComponentDefinitionFromString<
  S extends OpenAPISchema,
  T extends string,
> = T extends keyof S["components"]["schemas"]
  ? ComponentDefinitionFromName<S, T>
  : never;
