import { makeOpenAPIRequest } from "../../src";
import { schema } from "../test-schema";

{
  // Valid request
  const res = await makeOpenAPIRequest(
    schema,
    "/pets/{id}",
    "post",
    {
      baseUrl: "http://example.com",
    },
    {
      body: {
        id: 123,
        name: "some-name",
        birthDate: "2021-01-01T00:00:00Z",
      },
      parameters: {
        id: 123,
      },
    },
  );

  if (res.code === 200) {
    res.body.id as number;
  } else if (res.code === 400) {
    res.body.message as string;
  }
}

{
  // Valid request
  const res = await makeOpenAPIRequest(
    schema,
    "/pets",
    "get",
    {
      baseUrl: "http://example.com",
    },
    {
      body: null,
      parameters: {
        "x-request-id": "some-request-id",
      },
    },
  );

  if (res.code === 200) {
    if (res.body.length > 0) {
      res.body[0].name as string;
    }
  } else if (res.code === 400) {
    res.body.message as string;
  }
}

{
  // Valid request
  const res = await makeOpenAPIRequest(
    schema,
    "/stats",
    "post",
    {
      baseUrl: "http://example.com",
    },
    {
      body: { includeCategories: true },
      parameters: {},
    },
  );

  if (res.code === 200) {
    res.body.uniqueCategories as number;
    // @ts-expect-error - casting number property to string
    res.body.uniqueCategories as string;
  } else if (res.code === 400) {
    res.body.message as string;
  }
}

{
  // Invalid body and parameters
  makeOpenAPIRequest(
    schema,
    "/pets/{id}",
    "post",
    {
      baseUrl: "http://example.com",
    },
    {
      // @ts-expect-error - missing id from body
      body: {
        name: "some-name",
      },
      // @ts-expect-error - missing parameter
      parameters: {},
    },
  );
}

{
  // Invalid path
  makeOpenAPIRequest(
    schema,
    // @ts-expect-error - path not in schema
    "/not-a-path",
    "post",
    {
      baseUrl: "http://example.com",
    },
    {
      body: {},
      parameters: {},
    },
  );
}

{
  // Invalid method for path
  makeOpenAPIRequest(
    schema,
    "/bulk-pets",
    // @ts-expect-error - method for path not in schema
    "delete",
    {
      baseUrl: "http://example.com",
    },
    {
      body: {},
      parameters: {},
    },
  );
}
