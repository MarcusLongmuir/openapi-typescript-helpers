import { createHandler } from "../../src";
import { schema } from "../test-schema";

{
  // Valid handler
  createHandler(schema, "/pets/{id}", "post", {}, (req) => {
    req.op.operationId as string;

    return Promise.resolve({
      code: 200,
      body: {
        id: 123,
        name: "some-name",
        birthDate: "2021-01-01T00:00:00Z",
      },
    });
  });
}

{
  // Valid handler with headers in response
  createHandler(schema, "/pets", "get", {}, (req) => {
    req.op.operationId as string;

    return Promise.resolve({
      code: 200,
      headers: {
        "x-next": "some-string",
      },
      body: [
        {
          id: 123,
          name: "some-name",
          birthDate: "2021-01-01T00:00:00Z",
        },
      ],
    });
  });
}

{
  // Valid handler with optional body
  createHandler(schema, "/stats", "post", {}, (req) => {
    req.op.operationId as string;

    if (req.body) {
      // Valid access of body
      req.body.includeCategories;
    }
    return Promise.resolve({
      code: 200,
      body: {
        totalCount: 123,
        uniqueCategories: 5,
      },
    });
  });
}

{
  // Valid handler with no response body
  createHandler(schema, "/get-obj", "delete", {}, async (req) => {
    req.op.operationId as string;

    if (Math.random() > 0.5) {
      return Promise.resolve({
        code: 503,
        body: {
          message: "Some error",
        },
      });
    }

    return Promise.resolve({
      code: 204,
    });
  });
}

{
  // Invalid access in handler
  createHandler(schema, "/pets/{id}", "post", {}, (req) => {
    req.op.operationId;

    // valid access of parameter property
    req.parameters.id as number;
    // @ts-expect-error -  valid access of parameter property, but with incorrect type
    req.parameters.id as string;

    // @ts-expect-error - access of non-existent parameter property
    req.parameters.notAParameterProperty;

    // valid access of body property
    req.body.id as number;
    // @ts-expect-error -  valid access of body property, but with incorrect type
    req.body.id as string;

    // @ts-expect-error - access of non-existent body property
    req.body.notABodyProperty;

    return Promise.resolve({
      code: 200,
      body: {
        id: 123,
        name: "some-name",
        birthDate: "2021-01-01T00:00:00Z",
      },
    });
  });
}

{
  // Invalid path
  createHandler(
    schema,
    // @ts-expect-error - missing path
    "/not-a-path",
    "post",
    {},
    (req) => {},
  );
}

{
  // Invalid method for path
  createHandler(
    schema,
    "/bulk-pets",
    // @ts-expect-error - missing method for path
    "delete",
    {},
    (req) => {},
  );
}

{
  // Invalid return body
  createHandler(
    schema,
    "/stats",
    "post",
    {},
    // @ts-expect-error - response body missing totalCount
    (req) => {
      req.op.operationId;

      // @ts-expect-error - unguarded access of property on optional body
      req.body.includeCategories;

      if (req.body) {
        // Valid access of body
        req.body.includeCategories as boolean;
      }
      return Promise.resolve({
        code: 200,
        body: {
          uniqueCategories: 5,
        },
      });
    },
  );
}
