import type { DeepReadonly } from "./DeepReadonly";
import type {
  OpenAPIOperationParameter,
  OpenAPISchema,
} from "./openapi-schema";
import type { ToValueType } from "./value-types";

export type ParametersForOp<Op> = Op extends {
  parameters: DeepReadonly<Array<OpenAPIOperationParameter>>;
}
  ? Op["parameters"]
  : Op extends object
    ? []
    : never;

export type AllParametersForOperation<
  Op extends DeepReadonly<{
    parameters?: Array<OpenAPIOperationParameter>;
  }>,
> = ParametersForOp<Op>[number];

export type PathParametersForOperation<
  Op extends DeepReadonly<{
    parameters?: Array<OpenAPIOperationParameter>;
  }>,
> = Extract<ParametersForOp<Op>[number], { in: "path" }>;

export type QueryParametersForOperation<
  Op extends DeepReadonly<{
    parameters?: Array<OpenAPIOperationParameter>;
  }>,
> = Extract<ParametersForOp<Op>[number], { in: "query" }>;

export type ParamObjectForName<P, N extends string> = P extends {
  name: infer Name;
}
  ? Name extends N
    ? P
    : never
  : never;

export type RecordOfAllParams<
  Op extends {
    parameters: Array<OpenAPIOperationParameter>;
  },
> = {
  [key in AllParametersForOperation<Op>["name"]]: ParamObjectForName<
    AllParametersForOperation<Op>,
    key
  >;
};

export type TypeForAllParamsBackup<
  S extends OpenAPISchema,
  Op extends DeepReadonly<{ parameters?: Array<OpenAPIOperationParameter> }>,
> = {
  [key in AllParametersForOperation<Op>["name"]]: ToValueType<
    S,
    ParamObjectForName<AllParametersForOperation<Op>, key>["schema"]
  >;
};

export type TypeForAllParams<
  S extends OpenAPISchema,
  Op extends DeepReadonly<{ parameters?: Array<OpenAPIOperationParameter> }>,
> = Partial<{
  [key in Exclude<AllParametersForOperation<Op>, { required: true }>["name"] &
    string]: ToValueType<
    S,
    ParamObjectForName<AllParametersForOperation<Op>, key>["schema"]
  >; // Optional properties
}> &
  Required<{
    [key in Extract<AllParametersForOperation<Op>, { required: true }>["name"] &
      string]: ToValueType<
      S,
      ParamObjectForName<AllParametersForOperation<Op>, key>["schema"]
    >; // Required properties
  }>;

export type RecordOfPathParams<
  Op extends { parameters?: Array<OpenAPIOperationParameter> },
> = {
  [key in PathParametersForOperation<Op>["name"]]: ParamObjectForName<
    PathParametersForOperation<Op>,
    key
  >;
};

export type RecordOfQueryParams<
  Op extends { parameters?: Array<OpenAPIOperationParameter> },
> = {
  [key in QueryParametersForOperation<Op>["name"]]: ParamObjectForName<
    QueryParametersForOperation<Op>,
    key
  >;
};
