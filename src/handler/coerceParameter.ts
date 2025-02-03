import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "../schema";

export function coerceParameter(
  input: string | boolean,
  schema: DeepReadonly<JSONSchema7>,
): string | number | boolean | Array<unknown> {
  if (schema.type === "integer") {
    const result = Math.floor(Number(input));
    return Number.isNaN(result) ? input : result;
  }
  if (schema.type === "number") {
    const result = Number(input);
    return Number.isNaN(result) ? input : result;
  }
  if (schema.type === "boolean") {
    if (typeof input === "boolean") {
      return input;
    }

    if (input === "false") {
      return false;
    }
    return true;
  }
  if (schema.type === "string") {
    return String(input);
  }
  if (schema.type === "array") {
    const items = schema.items;
    if (typeof items === "object") {
      const split = input.toString().split(",");
      const asValues = [];
      for (const inString of split) {
        asValues.push(
          coerceParameter(inString, items as DeepReadonly<JSONSchema7>),
        );
      }
      return asValues;
    }
    throw new Error("Unsupported array items type for coercion");
  }
  throw new Error(`Unsupported schema type ${schema.type}`);
}
