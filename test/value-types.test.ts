import * as ajv from "ajv";

import type { ComponentDefinitionFromName, ToValueType } from "../src";
import type { schema } from "./test-schema";

type schemaType = typeof schema;

describe("ToValueType", () => {
  test("can extract a type from a schema", () => {
    type newPet = ToValueType<
      schemaType,
      ComponentDefinitionFromName<schemaType, "NewPet">
    >;

    const newPet: newPet = {
      name: "a thing",
      tag: "a tag",
      birthDate: "2021-01-01T00:00:00Z",
    };
    expect(newPet.name).toEqual("a thing");
  });
});
