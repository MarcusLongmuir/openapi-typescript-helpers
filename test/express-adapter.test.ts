import http from "node:http";
import express from "express";
import { createHandler, registerOpenAPIHandlerToExpress } from "../src";
import { schema } from "./test-schema";

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());

  registerOpenAPIHandlerToExpress(
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
    false,
  );

  registerOpenAPIHandlerToExpress(
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
    true,
  );

  registerOpenAPIHandlerToExpress(
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
    false,
  );

  registerOpenAPIHandlerToExpress(
    app,
    createHandler(schema, "/pets/{id}", "delete", {}, () => {
      return Promise.resolve({ code: 204 });
    }),
    false,
  );

  registerOpenAPIHandlerToExpress(
    app,
    createHandler(schema, "/get-obj", "post", {}, () => {
      throw new Error("intentional error");
    }),
    false,
  );

  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  baseUrl = `http://localhost:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("Express adapter", () => {
  test("GET with query params, header, and response headers", async () => {
    const res = await fetch(`${baseUrl}/pets?tags=cat,dog&limit=10`, {
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
    const res = await fetch(`${baseUrl}/pets`, {
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
    const res = await fetch(`${baseUrl}/pets/42`, {
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
    const res = await fetch(`${baseUrl}/pets/1`, { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  test("POST with invalid body returns validation errors", async () => {
    const res = await fetch(`${baseUrl}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: 456 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  test("handler error returns 500", async () => {
    const res = await fetch(`${baseUrl}/get-obj`, { method: "POST" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "Internal Server Error" });
  });
});
