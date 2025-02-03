import type { DeepReadonly } from "./DeepReadonly";
import type { OpenAPIOperationHeader, OpenAPISchema } from "./openapi-schema";
import type { ToValueType } from "./value-types";

export type TypeForAllHeaders<
  S extends OpenAPISchema,
  Op extends DeepReadonly<{
    headers: { [key: string]: OpenAPIOperationHeader };
  }>,
> = {
  [key in keyof Op["headers"]]: ToValueType<S, Op["headers"][key]["schema"]>;
};
