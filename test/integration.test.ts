import {
  type GetOperationByPathAndMethod,
  type OpenAPIHandler,
  type OpenAPIResponseTypes,
  createHandler,
  genericOpenAPIResponseToResponse,
  makeOpenAPIRequest,
  requestToGenericOpenAPIRequest,
} from "../src";
import { schema } from "./test-schema";

type schemaType = typeof schema;

function fetchOverrideToHandler(handler: OpenAPIHandler<Request>) {
  return async (request: Request) => {
    const resOrError = await handler.handle(
      requestToGenericOpenAPIRequest(request),
      request,
    );
    if (resOrError instanceof Error) {
      throw resOrError;
    }
    return genericOpenAPIResponseToResponse(resOrError);
  };
}

describe("handler and client", () => {
  test("basic get operation with no parameters and optional body", async () => {
    const getStatsHandler = createHandler(
      schema,
      "/stats",
      "post",
      {},
      (req) => {
        expect(req.op.operationId).toEqual("getStats");
        if (req.body) {
          expect(req.body.includeCategories).toEqual(true);
        }
        const responseBody: Extract<
          OpenAPIResponseTypes<
            schemaType,
            GetOperationByPathAndMethod<
              schemaType,
              "/stats",
              "post"
            >["responses"]
          >,
          { code: 200 }
        >["body"] = {
          totalCount: 123,
        };
        if (req.body?.includeCategories) {
          responseBody.uniqueCategories = 5;
        }
        return Promise.resolve({
          code: 200,
          body: responseBody,
        });
      },
    );
    const statsWithBodyResponse = await makeOpenAPIRequest(
      schema,
      "/stats",
      "post",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(getStatsHandler),
      },
      {
        parameters: {
          "x-request-id": "not-a-uuid",
        },
        body: {
          includeCategories: true,
        },
      },
    );
    expect(statsWithBodyResponse.body).toEqual({
      totalCount: 123,
      uniqueCategories: 5,
    });

    const statsWithoutBodyResponse = await makeOpenAPIRequest(
      schema,
      "/stats",
      "post",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(getStatsHandler),
      },
      {
        parameters: {
          "x-request-id": "not-a-uuid",
        },
        body: undefined,
      },
    );
    if (statsWithoutBodyResponse instanceof Error) {
      throw statsWithoutBodyResponse;
    }
    expect(statsWithoutBodyResponse.body).toEqual({ totalCount: 123 });
  });

  test("basic get operation with query parameter and response header", async () => {
    const listPetsHandler = createHandler(schema, "/pets", "get", {}, (req) => {
      expect(req.parameters["x-request-id"]).toEqual("not-a-uuid");
      if (!req.parameters.tags) {
        throw new Error("expected tags");
      }
      expect(req.parameters.tags).toEqual(["some-tag", "another-tag"]);
      expect(req.parameters.limit).toEqual(100);
      expect(req.op.operationId).toEqual("findPets");
      expect(req.body).toEqual(null);
      return Promise.resolve({
        code: 200,
        headers: {
          "x-next": "some-string",
        },
        body: [
          {
            id: 123,
            name: "created-pet",
            tags: ["some-tag"],
            birthDate: "2021-01-01T00:00:00Z",
          },
        ],
      });
    });

    const listResponse = await makeOpenAPIRequest(
      schema,
      "/pets",
      "get",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(listPetsHandler),
      },
      {
        parameters: {
          "x-request-id": "not-a-uuid",
          limit: 100,
          tags: ["some-tag", "another-tag"],
        },
        body: null,
      },
    );

    expect(listResponse.code).toEqual(200);
    expect(listResponse.headers?.["x-next"]).toEqual("some-string");
    expect(listResponse.body).toEqual([
      {
        id: 123,
        name: "created-pet",
        tags: ["some-tag"],
        birthDate: "2021-01-01T00:00:00Z",
      },
    ]);
  });

  test("basic post operation with request body", async () => {
    const addPetsHandler = createHandler(schema, "/pets", "post", {}, (req) => {
      expect(req.op.operationId).toEqual("addPet");
      expect(req.body.name).toEqual("added-pet");

      return Promise.resolve({
        code: 200,
        body: {
          id: 123,
          name: "added-pet",
          tag: "added-tag",
          birthDate: "2021-01-01T00:00:00Z",
        },
      });
    });

    const response = await makeOpenAPIRequest(
      schema,
      "/pets",
      "post",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(addPetsHandler),
      },
      {
        parameters: {},
        body: {
          name: "added-pet",
          tag: "added-tag",
          birthDate: "2021-01-01T00:00:00Z",
        },
      },
    );

    expect(response.body).toEqual({
      id: 123,
      name: "added-pet",
      tag: "added-tag",
      birthDate: "2021-01-01T00:00:00Z",
    });
  });

  test("basic post operation with invalid request body receives error", async () => {
    const addPetsHandler = createHandler(schema, "/pets", "post", {}, (req) => {
      throw new Error("should not be called");
    });

    const response = await makeOpenAPIRequest(
      schema,
      "/pets",
      "post",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(addPetsHandler),
      },
      {
        parameters: {},
        body: {
          // intentionally missing required name field
          tag: 456,
          birthDate: "not-a-date",
        } as any,
      },
    );

    expect(response.body).toEqual({
      errors: [
        {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'name'",
          params: {
            missingProperty: "name",
          },
          schemaPath: "#/components/schemas/NewPet/required",
        },
        {
          instancePath: "/tag",
          keyword: "type",
          message: "must be string",
          params: {
            type: "string",
          },
          schemaPath: "#/components/schemas/NewPet/properties/tag/type",
        },
        {
          instancePath: "/birthDate",
          keyword: "format",
          message: 'must match format "date-time"',
          params: {
            format: "date-time",
          },
          schemaPath: "#/components/schemas/NewPet/properties/birthDate/format",
        },
      ],
    });
  });

  test("basic post operation with path parameter and request body", async () => {
    const updatePetHandler = createHandler(
      schema,
      "/pets/{id}",
      "post",
      {},
      (req) => {
        expect(req.op.operationId).toEqual("updatePet");
        expect(req.parameters.id).toEqual(123);

        expect(req.body.id).toEqual(123);
        expect(req.body.tag).toEqual("updated-tag");

        return Promise.resolve({
          code: 200,
          body: {
            id: 123,
            name: "updated-pet",
            tag: "updated-tag",
            birthDate: "2021-01-01T00:00:00Z",
          },
        });
      },
    );
    expect(updatePetHandler.colonUrlPattern).toEqual("/pets/:id");

    const response = await makeOpenAPIRequest(
      schema,
      "/pets/{id}",
      "post",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(updatePetHandler),
      },
      {
        parameters: {
          id: 123,
        },
        body: {
          name: "updated-pet",
          tag: "updated-tag",
          birthDate: "2021-01-01T00:00:00Z",
          id: 123,
        },
      },
    );

    expect(response.body).toEqual({
      id: 123,
      name: "updated-pet",
      tag: "updated-tag",
      birthDate: "2021-01-01T00:00:00Z",
    });
  });

  test("basic delete operation with no response body", async () => {
    const deletePetHandler = createHandler(
      schema,
      "/pets/{id}",
      "delete",
      {},
      (req) => {
        expect(req.op.operationId).toEqual("deletePet");
        expect(req.parameters.id).toEqual(123);
        expect(req.body).toEqual(null);

        return Promise.resolve({
          code: 204,
        });
      },
    );

    const response = await makeOpenAPIRequest(
      schema,
      "/pets/{id}",
      "delete",
      {
        baseUrl: "http://example.com",
        fetchOverride: fetchOverrideToHandler(deletePetHandler),
      },
      {
        parameters: {
          id: 123,
        },
        body: null,
      },
    );

    expect(response.body).toEqual(null);
  });
});
