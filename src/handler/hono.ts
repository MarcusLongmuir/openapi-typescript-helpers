import type { Context } from "hono";

import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";
import type { OpenAPIHandler } from "./handlers";

const honoMethods = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
] as const;

type HonoMethods = (typeof honoMethods)[number];

type HonoInstance = {
  [key in HonoMethods]: (
    path: string,
    handler: (c: Context) => Promise<Response>,
  ) => any;
};

export function honoContextToGenericOpenAPIRequest(
  c: Context,
): GenericOpenAPIRequest {
  return {
    url: c.req.url,
    method: c.req.method,
    headers: c.req.raw.headers,
    bodyString: () => c.req.text(),
  };
}

export function genericOpenAPIResponseToHonoResponse(
  genericRes: GenericOpenAPIResponse,
): Response {
  return new Response(
    genericRes.body ? JSON.stringify(genericRes.body) : null,
    {
      status: genericRes.statusCode,
      headers: genericRes.headers,
    },
  );
}

export function registerOpenAPIHandlerToHono(
  honoInstance: HonoInstance,
  handler: OpenAPIHandler<Context>,
) {
  const method = handler.method as string;
  if (!honoMethods.includes(method as HonoMethods)) {
    throw new Error(
      `Unsupported HTTP method "${method}" for Hono adapter. Supported: ${honoMethods.join(", ")}`,
    );
  }
  honoInstance[method as HonoMethods](
    `${handler.baseUrl}${handler.colonUrlPattern}`,
    async (c: Context) => {
      let response: GenericOpenAPIResponse | Error;
      try {
        const genericReq = honoContextToGenericOpenAPIRequest(c);
        response = await handler.handle(genericReq, c);
      } catch {
        return genericOpenAPIResponseToHonoResponse({
          statusCode: 500,
          headers: new Headers(),
          body: { message: "Internal Server Error" },
        });
      }
      if (response instanceof Error) {
        throw response;
      }
      return genericOpenAPIResponseToHonoResponse(response);
    },
  );
}
