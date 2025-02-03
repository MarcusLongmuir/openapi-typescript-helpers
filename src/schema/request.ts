import type { DeepReadonly } from "./DeepReadonly";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";

export type RequestBodySchemaForOp<T> = T extends {
  requestBody: {
    content: {
      "application/json": {
        schema: infer R;
      };
    };
  };
}
  ? R
  : T extends object
    ? undefined
    : never;

export type RequestBodyTypeForOperation<
  S extends OpenAPISchema,
  Operation extends DeepReadonly<OpenAPIOperation>,
> = RequestBodySchemaForOp<Operation> extends undefined
  ? null
  : ToValueType<S, RequestBodySchemaForOp<Operation>>;
