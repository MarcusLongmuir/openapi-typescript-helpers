import type {
  DeepReadonly,
  OpenAPIResponseDefinitionToResponse,
  OpenAPIResponseTypes,
  ToValueType,
} from "../../src";
import type { schema } from "../test-schema";

{
  // Direct response type (no indirection using $ref)
  type DirectRespType = OpenAPIResponseDefinitionToResponse<
    typeof schema,
    DeepReadonly<(typeof schema)["paths"]["/get-obj"]["post"]["responses"][200]>
  >;

  type RespType =
    (typeof schema)["paths"]["/get-obj"]["post"]["responses"][200]["content"]["application/json"]["schema"];
  type Value = ToValueType<typeof schema, RespType>;

  let asDirectRespType: DirectRespType = {
    body: {
      childObj: {
        a: "some-string",
        b: 123,
      },
    },
  };

  asDirectRespType = {
    // @ts-expect-error - missing body properties
    body: {},
  };
}

{
  // Direct response type with no body
  type DirectRespType = OpenAPIResponseDefinitionToResponse<
    typeof schema,
    DeepReadonly<
      (typeof schema)["paths"]["/get-obj"]["delete"]["responses"][204]
    >
  >;

  let asDirectRespType: DirectRespType = {
    body: undefined,
  };

  asDirectRespType = {
    // @ts-expect-error - should not specify body
    body: {},
  };
}

{
  // $ref-described contents
  type RefIncludingType = OpenAPIResponseDefinitionToResponse<
    typeof schema,
    DeepReadonly<(typeof schema)["paths"]["/stats"]["post"]["responses"][200]>
  >;

  let asRefIncludingType: RefIncludingType = {
    body: {
      totalCount: 123,
    },
  };

  asRefIncludingType = {
    // @ts-expect-error - missing body properties
    body: {},
  };
}

{
  // Response that uses $ref to point to a reusable response
  type RefRespType = OpenAPIResponseDefinitionToResponse<
    typeof schema,
    DeepReadonly<(typeof schema)["components"]["responses"]["Unauthorized"]>
  >;

  let asRefRespType: RefRespType = {
    body: {
      message: "some-message",
    },
  };

  asRefRespType = {
    // @ts-expect-error - missing body properties
    body: {},
  };
}

{
  // Union type across all responses that requires including matching code property
  type AllResponses = OpenAPIResponseTypes<
    typeof schema,
    DeepReadonly<(typeof schema)["paths"]["/stats"]["post"]["responses"]>
  >;

  let asAllResponses: AllResponses = {
    code: 200,
    body: {
      totalCount: 123,
    },
  };

  asAllResponses = {
    code: 401,
    body: {
      message: "some-message",
    },
  };

  asAllResponses = {
    code: 200,
    body: {
      totalCount: 123,
    },
  };

  asAllResponses = {
    code: 200,
    // @ts-expect-error - missing body properties
    body: {},
  };

  asAllResponses = {
    code: 401,
    // @ts-expect-error - missing body properties
    body: {},
  };

  // @ts-expect-error - missing code property
  asAllResponses = {
    body: {
      totalCount: 123,
    },
  };

  asAllResponses = {
    code: 401,
    body: {
      // @ts-expect-error - mismatched code/body
      totalCount: 123,
    },
  };
}
