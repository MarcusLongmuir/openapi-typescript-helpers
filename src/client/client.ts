import type {











import type { RequestOptions } from "./requestOptions";
















  perRequestMiddleware?: Array<OpenAPIHandlerMiddleware<S, Operation>>,










































    perRequestMiddleware?: Array<
      OpenAPIHandlerMiddleware<S, GetOperationByPathAndMethod<S, P, M>>
    >,

    // Make a single per-request middleware function that calls each middleware in order
    const perRequestMiddlewareFn =
      perRequestMiddleware?.reduceRight(
        (prev, curr) => (req, next) => curr(req, prev.bind(null, req, next)),
        (req, next) => next(req),
      ) || ((req, next) => next(req));
    return perRequestMiddlewareFn(req, (req) =>
      middleware(req, (updatedReq) =>
        makeOpenAPIRequest(schema, opPath, opMethod, options, updatedReq),
      ),

















































