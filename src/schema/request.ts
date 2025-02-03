import type { DeepReadonly } from "./DeepReadonly";
import type { OpenAPIOperation, OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";


















> = RequestBodySchemaForOp<Operation> extends undefined
  ? null
  : ToValueType<S, RequestBodySchemaForOp<Operation>>;
