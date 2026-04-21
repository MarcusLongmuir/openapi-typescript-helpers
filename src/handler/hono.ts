import type { Context } from "hono";

import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";
import type { OpenAPIHandler } from "./handlers";

type HonoMethods =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch"
  | "all";

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
  // Hono handles HEAD via GET automatically, so head is not in HonoMethods
  honoInstance[handler.method as HonoMethods](
    `${handler.baseUrl}${handler.colonUrlPattern}`,
    async (c: Context) => {
      const genericReq = honoContextToGenericOpenAPIRequest(c);
      const response = await handler.handle(genericReq, c);
      if (response instanceof Error) {
        throw response;
      }
      return genericOpenAPIResponseToHonoResponse(response);
    },
  );
}
