import { Hono } from "hono";
import { createHandler, registerOpenAPIHandlerToHono } from "../src";
import { schema } from "./test-schema";

const app = new Hono();

beforeAll(() => {
  registerOpenAPIHandlerToHono(
    app,
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

  registerOpenAPIHandlerToHono(
    app,
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

  registerOpenAPIHandlerToHono(
    app,
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

  registerOpenAPIHandlerToHono(
    app,
    createHandler(schema, "/pets/{id}", "delete", {}, () => {
      return Promise.resolve({ code: 204 });
    }),
  );
});

describe("Hono adapter", () => {
  test("GET with query params, header, and response headers", async () => {
    const res = await app.request("/pets?tags=cat,dog&limit=10", {
      headers: { "x-request-id": "test-uuid" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-next")).toBe("/pets?page=2");
    expect(await res.json()).toEqual([
      {
        id: 1,
        name: "Fido",
        tags: ["cat", "dog"],
        birthDate: "2021-01-01T00:00:00Z",
      },
    ]);
  });

  test("POST with JSON body", async () => {
    const res = await app.request("/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Buddy",
        tag: "dog",
        birthDate: "2022-06-15T00:00:00Z",
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 1,
      name: "Buddy",
      tag: "dog",
      birthDate: "2022-06-15T00:00:00Z",
    });
  });

  test("POST with path params and body", async () => {
    const res = await app.request("/pets/42", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 42,
        name: "Updated",
        birthDate: "2022-06-15T00:00:00Z",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(42);
    expect(body.name).toBe("Updated");
  });

  test("DELETE with no response body", async () => {
    const res = await app.request("/pets/1", { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  test("POST with invalid body returns validation errors", async () => {
    const res = await app.request("/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: 456 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
