import * as ajv from "ajv";

import type { OpenAPISchema } from "../schema/openapi-schema";

export function createSchemaComponentValidator(schema: OpenAPISchema): ajv.Ajv {
  const ajvInstance = new ajv.Ajv({
    useDefaults: true,
    allErrors: true,
    strict: false,
    discriminator: true,
  });
  ajvInstance.addFormat("int64", {
    type: "number",
    validate: (input: number) => {
      return Number.isInteger(input);
    },
  });
  for (const [name, compSchema] of Object.entries(
    schema.components.schemas || {},
  )) {
    ajvInstance.addSchema(compSchema, `#/components/schemas/${name}`);
  }
  return ajvInstance;
}
