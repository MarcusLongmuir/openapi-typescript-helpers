import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "../schema";







    return Number.isNaN(result) ? input : result;
  }if (schema.type === "number") {

    return Number.isNaN(result) ? input : result;
  }if (schema.type === "boolean") {







      return true;
  }if (schema.type === "string") {

  }if (schema.type === "array") {











      throw new Error("Unsupported array items type for coercion");

    throw new Error(`Unsupported schema type ${schema.type}`);

