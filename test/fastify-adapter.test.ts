import Fastify from "fastify";
import { createHandler, registerOpenAPIHandlerToFastify } from "../src";
import { schema } from "./test-schema";

const fastify = Fastify();

beforeAll(async () => {
  registerOpenAPIHandlerToFastify(
    fastify,
    createHandler(schema, "/pets", "get", {}, (req) => {
      return Promise.resolve({
        code: 200,
        headers: { "x-next": "/pets?page=2" },
        body: [
          {
            id: 1,
            name: "Fido",
            tags: req.parameters.tags,
            birthDate: "2021-01-01T00:00:00Z",
          },
        ],
      });
    }),
  );

  registerOpenAPIHandlerToFastify(
    fastify,
    createHandler(schema, "/pets", "post", {}, (req) => {
      return Promise.resolve({
        code: 200,
        body: {
          id: 1,
          name: req.body.name,
          tag: req.body.tag,
          birthDate: req.body.birthDate,
        },
      });
    }),
  );

  registerOpenAPIHandlerToFastify(
    fastify,
    createHandler(schema, "/pets/{id}", "post", {}, (req) => {
      return Promise.resolve({
        code: 200,
        body: {
          id: req.parameters.id,
          name: req.body.name,
          birthDate: req.body.birthDate,
        },
      });
    }),
  );

  registerOpenAPIHandlerToFastify(
    fastify,
    createHandler(schema, "/pets/{id}", "delete", {}, () => {
      return Promise.resolve({ code: 204 });
    }),
  );

  await fastify.ready();
});

afterAll(async () => {
  await fastify.close();
});

describe("Fastify adapter", () => {
  test("GET with query params, header, and response headers", async () => {
    const res = await fastify.inject({
      method: "GET",
      url: "/pets?tags=cat,dog&limit=10",
      headers: { "x-request-id": "test-uuid" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-next"]).toBe("/pets?page=2");
    expect(res.json()).toEqual([
      {
        id: 1,
        name: "Fido",
        tags: ["cat", "dog"],
        birthDate: "2021-01-01T00:00:00Z",
      },
    ]);
  });

  test("POST with JSON body", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: "/pets",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({
        name: "Buddy",
        tag: "dog",
        birthDate: "2022-06-15T00:00:00Z",
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: 1,
      name: "Buddy",
      tag: "dog",
      birthDate: "2022-06-15T00:00:00Z",
    });
  });

  test("POST with path params and body", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: "/pets/42",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({
        id: 42,
        name: "Updated",
        birthDate: "2022-06-15T00:00:00Z",
      }),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(42);
    expect(body.name).toBe("Updated");
  });

  test("DELETE with no response body", async () => {
    const res = await fastify.inject({
      method: "DELETE",
      url: "/pets/1",
    });
    expect(res.statusCode).toBe(204);
  });

  test("POST with invalid body returns validation errors", async () => {
    const res = await fastify.inject({
      method: "POST",
      url: "/pets",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify({ tag: 456 }),
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
