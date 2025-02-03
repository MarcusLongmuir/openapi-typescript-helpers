import type { ComponentTypeFromName } from "@marcuslongmuir/openapi-typescript-helpers";

import type {
  ComponentDefinitionFromName,
  GetOperationByPathAndMethod,
  RequestBodyTypeForOperation,
  ToValueType,
} from "../../src";
import type { schema } from "../test-schema";

type schemaType = typeof schema;

{
  // ToValueType of simple schema component

  type SimpleType = ToValueType<
    schemaType,
    ComponentDefinitionFromName<schemaType, "NewPet">
  >;

  const valid: SimpleType = {
    name: "some-name",
    tag: "a tag",
    birthDate: "2021-01-01T00:00:00Z",
  };

  let invalid: SimpleType = {
    name: "some-name",
    tag: "a tag",
    // @ts-expect-error - extra should not be present
    extra: true,
  };

  invalid = {
    // @ts-expect-error - id should not be present
    id: 123,
    name: "some-name",
    tag: "a tag",
  };

  invalid = {
    // @ts-expect-error - name should be a string
    name: 123,
    tag: "a tag",
  };

  // @ts-expect-error - missing name
  invalid = {
    tag: "a tag",
  };
}

{
  // ToValueType of an "allOf" schema component

  type AllOfType = ToValueType<
    schemaType,
    ComponentDefinitionFromName<schemaType, "Pet">
  >;

  const valid: AllOfType = {
    id: 123,
    name: "some-name",
    tag: "a tag",
    birthDate: "2021-01-01T00:00:00Z",
  };

  let invalid: AllOfType = {
    id: 123,
    name: "some-name",
    tag: "a tag",
    // @ts-expect-error - extra should not be present
    extra: true,
  };

  // @ts-expect-error - missing id
  invalid = {
    name: "some-name",
    tag: "a tag",
  };

  // @ts-expect-error - missing name
  invalid = {
    tag: "a tag",
  };
}

{
  // ToValueType of an "anyOf" schema component

  type AnyOfType = ComponentTypeFromName<schemaType, "SomeAnyOf">;

  const valid1: AnyOfType = { type: "referenceOfId", someId: "some-id" };
  const valid2: AnyOfType = { type: "direct", directValue: "some-value" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid1: AnyOfType = { type: "invalid", someId: "some-id" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid2: AnyOfType = { type: "direct", someId: "some-id" };
  // @ts-expect-error - additional key
  const invalid3: AnyOfType = { type: "referenceOfId", notAKey: "some-id" };
}

{
  // ToValueType of an "oneOf" schema component

  type OneOfType = ComponentTypeFromName<schemaType, "SomeOneOf">;

  const valid1: OneOfType = { type: "referenceOfId", someId: "some-id" };
  const valid2: OneOfType = { type: "direct", directValue: "some-value" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid1: OneOfType = { type: "invalid", someId: "some-id" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid2: OneOfType = { type: "direct", someId: "some-id" };
  // @ts-expect-error - additional key
  const invalid3: OneOfType = { type: "referenceOfId", notAKey: "some-id" };
}

{
  // ToValueType of a array schema as a request body

  type RequestType = RequestBodyTypeForOperation<
    schemaType,
    GetOperationByPathAndMethod<schemaType, "/bulk-pets", "post">
  >;

  const valid: RequestType = [
    {
      id: 123,
      name: "some-name",
      tag: "a tag",
      birthDate: "2021-01-01T00:00:00Z",
    },
  ];

  const invalid: RequestType = [
    {
      // @ts-expect-error - id should be a number
      id: "not-a-number",
      name: "some-name",
      tag: "a tag",
    },
  ];
}

{
  // ToValueType of an enum string

  const myVal = { type: "string", enum: ["a", "b", "c"] } as const;
  type EnumValueType = ToValueType<schemaType, typeof myVal>;

  const valid: EnumValueType = "a";
  // @ts-expect-error - not in enum
  const invalid: EnumValueType = "d";
}

{
  // ToValueType of an anyOf

  const myVal = {
    oneOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["type", "someId"],
        properties: {
          someId: {
            type: "string",
          },
          parameters: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
          type: {
            type: "string",
            enum: ["referenceOfId"],
          },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["type", "direct"],
        properties: {
          type: {
            type: "string",
            enum: ["direct"],
          },
          directValue: {
            type: "string",
          },
        },
      },
    ],
  } as const;

  type AnyOfType = ToValueType<schemaType, typeof myVal>;

  const valid1: AnyOfType = { type: "referenceOfId", someId: "some-id" };
  const valid2: AnyOfType = { type: "direct", directValue: "some-value" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid1: AnyOfType = { type: "invalid", someId: "some-id" };
  // @ts-expect-error - does not match the shape of one of the options
  const invalid2: AnyOfType = { type: "direct", someId: "some-id" };
  // @ts-expect-error - additional key
  const invalid3: AnyOfType = { type: "referenceOfId", notAKey: "some-id" };
}
