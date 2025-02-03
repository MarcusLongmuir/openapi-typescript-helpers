import type {
  Application as ExpressApplication,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";
import type { OpenAPIHandler } from "./handlers";

export function expressRequestToGenericOpenAPIRequest(
  expressReq: ExpressRequest,
): GenericOpenAPIRequest {
  const headers = new Headers();
  for (const key in expressReq.headers) {
    const value = expressReq.headers[key];
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
  const url = `${expressReq.protocol}://${expressReq.get("host")}${expressReq.originalUrl}`;
  return {
    url,
    method: expressReq.method,
    headers,
    bodyString: async () => {
      return Promise.resolve(JSON.stringify(expressReq.body));
    },
  };
}

export function applyGenericOpenAPIResponseToExpressResponse(
  genericRes: GenericOpenAPIResponse,
  expressReply: ExpressResponse,
) {
  expressReply.status(genericRes.statusCode);
  const hdrs: Headers = genericRes.headers;

  hdrs.forEach((value, key) => {
    expressReply.setHeader(key, value);
  });

  if (genericRes.body) {
    expressReply.send(genericRes.body);
  } else {
    expressReply.end();
  }
}

type RequestWithLogging = {
  log?: {
    info: (message: unknown) => void;
    warn: (message: unknown) => void;
    error: (message: unknown) => void;
  };
};

const logFieldCharacterLimit = 10 * 1024;

function truncateString(str: string, maxLength: number): string {
  return str.length > maxLength
    ? `${str.slice(0, maxLength)}... [truncated]`
    : str;
}

function truncateJSON(obj: any, maxFieldLength: number): any {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateJSON(item, maxFieldLength));
  }

  const truncatedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      truncatedObj[key] = truncateString(value, maxFieldLength);
    } else if (typeof value === "object") {
      truncatedObj[key] = truncateJSON(value, maxFieldLength);
    } else {
      truncatedObj[key] = value;
    }
  }

  return truncatedObj;
}

export function registerOpenAPIHandlerToExpress(
  expressInstance: ExpressApplication,
  handler: OpenAPIHandler<ExpressRequest>,
  enableLogging = true,
) {
  expressInstance[handler.method](
    `${handler.baseUrl}${handler.colonUrlPattern}`,
    async (request: ExpressRequest, reply: ExpressResponse) => {
      const genericReq = expressRequestToGenericOpenAPIRequest(request);
      let response: GenericOpenAPIResponse | Error;
      try {
        const openAPIInfo = {
          openAPIPath: handler.opPath,
          openAPIMethod: handler.method,
          openAPIOperationId: handler.opId,
        };
        const startTime = performance.now();
        if (enableLogging) {
          // Extract the body and log it
          let bodyLog: any;
          const bodyString = await genericReq.bodyString();
          if (bodyString) {
            try {
              const asJSON = JSON.parse(bodyString);
              bodyLog = truncateJSON(asJSON, logFieldCharacterLimit);
            } catch {
              bodyLog = truncateString(bodyString, logFieldCharacterLimit);
              (request as RequestWithLogging).log?.warn({
                message: "Failed to parse JSON body",
                body: bodyLog,
              });
            }
          }
          const loggableReq: Exclude<
            GenericOpenAPIRequest,
            "bodyString" | "headers"
          > & {
            body: any;
            headers?: any; // Allows deleting
            bodyString?: any; // Allows deleting
          } = {
            ...genericReq,
            body: bodyLog,
          };
          loggableReq.headers = undefined;
          loggableReq.bodyString = undefined;
          (request as RequestWithLogging).log?.info({
            openAPIRequest: loggableReq,
            ...openAPIInfo,
          });
        }
        response = await handler.handle(genericReq, request);
        if (enableLogging) {
          const endTime = performance.now();
          const openAPIHandlerDuration = endTime - startTime;
          (request as RequestWithLogging).log?.info({
            openAPIResponse: truncateJSON(response, logFieldCharacterLimit),
            openAPIHandlerDuration,
            ...openAPIInfo,
          });
        }
      } catch (err) {
        if (enableLogging) {
          (request as RequestWithLogging).log?.error(err);
        }
        const response: GenericOpenAPIResponse = {
          statusCode: 500,
          headers: new Headers(),
          body: { message: "Internal Server Error" },
        };
        return applyGenericOpenAPIResponseToExpressResponse(response, reply);
      }
      return applyGenericOpenAPIResponseToExpressResponse(response, reply);
    },
  );
}
