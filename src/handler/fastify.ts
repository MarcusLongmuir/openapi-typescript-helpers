import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";
import type { OpenAPIHandler } from "./handlers";

type FastifyMethods =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch"
  | "all";

type FastifyInstance = {
  [key in FastifyMethods]: (
    path: string,
    handler: (req: FastifyRequest, rep: FastifyReply) => Promise<void>,
  ) => void;
};

export function fastifyRequestToGenericOpenAPIRequest(
  fastifyReq: FastifyRequest,
): GenericOpenAPIRequest {
  const headers = new Headers();
  for (const key in fastifyReq.headers) {
    const value = fastifyReq.headers[key];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
      } else {
        headers.append(key, value);
      }
    }
  }
  return {
    // Make the url absolute (include a host)
    url: `http://host${fastifyReq.originalUrl}`,
    method: fastifyReq.method,
    headers,
    bodyString: async () => {
      return Promise.resolve(JSON.stringify(fastifyReq.body));
    },
  };
}

export function applyGenericOpenAPIResponseToFastifyReply(
  genericRes: GenericOpenAPIResponse,
  fastifyReply: FastifyReply,
) {
  fastifyReply.code(genericRes.statusCode);
  const hdrs: Headers = genericRes.headers;

  const headerObj: { [key: string]: string } = {};
  hdrs.forEach((value, key) => {
    headerObj[key] = value;
  });
  fastifyReply.headers(headerObj);

  if (genericRes.body) {
    fastifyReply.send(genericRes.body);
  }
}

export function registerOpenAPIHandlerToFastify(
  fastifyInstance: FastifyInstance,
  handler: OpenAPIHandler<FastifyRequest>,
) {
  fastifyInstance[handler.method](
    `${handler.baseUrl}${handler.colonUrlPattern}`,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const genericReq = fastifyRequestToGenericOpenAPIRequest(request);
      const response = await handler.handle(genericReq, request);
      if (response instanceof Error) {
        throw response;
      }
      return applyGenericOpenAPIResponseToFastifyReply(response, reply);
    },
  );
}
