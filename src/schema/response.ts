import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "./DeepReadonly";
import type { TypeForAllHeaders } from "./headers";
import type {
  OpenAPIOperationDirectResponse,
  OpenAPIOperationHeader,
  OpenAPIOperationResponse,
  OpenAPISchema,
} from "./openapi-schema";
import type { ToValueType } from "./value-types";

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type OpenAPIResponseDefinitionToResponse<
  S extends OpenAPISchema,
  T extends DeepReadonly<OpenAPIOperationDirectResponse>,
> = (T extends {
  content: {
    "application/json": {
      schema: DeepReadonly<JSONSchema7>;
    };
  };
}
  ? {
      body: ToValueType<S, T["content"]["application/json"]["schema"]>;
    }
  : { body?: undefined }) &
  (T extends {
    headers: {
      [key: string]: OpenAPIOperationHeader;
    };
  }
    ? { headers: TypeForAllHeaders<S, { headers: T["headers"] }> }
    : { headers?: undefined });

export type BuildTuple<
  L extends number,
  T extends readonly unknown[] = [],
> = T extends { readonly length: L } ? T : BuildTuple<L, [...T, never]>;

type NumRange<
  Start extends number,
  End extends number,
  List extends unknown[] = BuildTuple<Start>,
> = List["length"] extends End
  ? Exclude<List[number], never>
  : NumRange<Start, End, [...List, List["length"]]>;

// All numbers from 200 to 599 as a union type
export type AllHandledResponseCodes = NumRange<200, 599>;

export type OpenAPIResponseTypes<
  S extends OpenAPISchema,
  T extends DeepReadonly<{
    [key: string | number]: OpenAPIOperationResponse;
  }>,
> = Writeable<
  {
    [K in keyof T]: {
      code: K extends "default" ? Exclude<AllHandledResponseCodes, keyof T> : K;
    } & (T[K] extends { $ref: `#/components/responses/${infer R}` }
      ? S["components"]["responses"] extends object
        ? OpenAPIResponseDefinitionToResponse<
            S,
            S["components"]["responses"][R]
          >
        : never
      : T[K] extends DeepReadonly<OpenAPIOperationDirectResponse>
        ? OpenAPIResponseDefinitionToResponse<S, T[K]>
        : { headers?: undefined; body?: undefined });
  }[keyof T]
>;
