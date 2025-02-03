import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";

export function requestToGenericOpenAPIRequest(
  req: Request,
): GenericOpenAPIRequest {
  return {
    headers: req.headers,
    method: req.method,
    url: req.url,
    bodyString(): Promise<string> {
      return req.text();
    },
  };
}

export function genericOpenAPIResponseToResponse(
  res: GenericOpenAPIResponse,
): Response {
  return new Response(res.body ? JSON.stringify(res.body) : null, {
    status: res.statusCode,
    headers: res.headers,
  });
}
