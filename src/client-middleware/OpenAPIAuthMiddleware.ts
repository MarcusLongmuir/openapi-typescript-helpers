import type { OpenAPIClientRequestParameters } from "../client";
import type {
  OpenAPIOperation,
  OpenAPIResponseTypes,
  OpenAPISchema,
} from "../schema";

export function OpenAPIAuthMiddleware(
  getAccessToken: () => Promise<string | null>,
  onUnauthorized?: () => void,
) {
  return async (
    req: OpenAPIClientRequestParameters<OpenAPISchema, OpenAPIOperation>,
    next: (
      req: OpenAPIClientRequestParameters<OpenAPISchema, OpenAPIOperation>,
    ) => Promise<
      OpenAPIResponseTypes<OpenAPISchema, OpenAPIOperation["responses"]>
    >,
  ): Promise<
    OpenAPIResponseTypes<OpenAPISchema, OpenAPIOperation["responses"]>
  > => {
    if (!req.headers) {
      req.headers = new Headers();
    }
    const token = await getAccessToken();
    if (token !== null) {
      req.headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await next(req);
    if (res.code.toString() === "401" && onUnauthorized) {
      onUnauthorized();
    }
    return res;
  };
}
