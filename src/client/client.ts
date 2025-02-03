import type {
  DeepReadonly,
  GetAllOperations,
  GetOperationByPathAndMethod,
  OpenAPIMethods,
  OpenAPIOperation,
  OpenAPIResponseTypes,
  OpenAPISchema,
  RequestBodyTypeForOperation,
  TypeForAllParams,
} from "../schema";
import { makeOpenAPIRequest } from "./makeOpenAPIRequest";
import type { RequestOptions } from "./requestOptions";

export type OpenAPIClientRequestParameters<
  S extends OpenAPISchema,
  Operation extends DeepReadonly<OpenAPIOperation>,
> = {
  headers?: Headers;
  parameters: TypeForAllParams<S, Operation>;
  body: RequestBodyTypeForOperation<S, Operation>;
  abortSignal?: AbortSignal;
};

export type OpenAPIClientOperationFunction<
  S extends OpenAPISchema,
  Operation extends DeepReadonly<OpenAPIOperation>,
> = (
  req: OpenAPIClientRequestParameters<S, Operation>,
  perRequestMiddleware?: Array<OpenAPIHandlerMiddleware<S, Operation>>,
) => Promise<OpenAPIResponseTypes<S, Operation["responses"]>>;

export type OpenAPIClient<S extends OpenAPISchema> = {
  [P in keyof S["paths"]]: {
    [M in keyof S["paths"][P] & OpenAPIMethods]: OpenAPIClientOperationFunction<
      S,
      S["paths"][P][M]
    >;
  };
} & {
  [key in GetAllOperations<S>["operationId"]]: OpenAPIClientOperationFunction<
    S,
    Extract<GetAllOperations<S>, { operationId: key }>
  >;
};

export type OpenAPIHandlerMiddleware<
  S extends OpenAPISchema,
  Operation extends DeepReadonly<OpenAPIOperation>,
> = (
  req: OpenAPIClientRequestParameters<S, Operation>,
  next: (
    req: OpenAPIClientRequestParameters<S, Operation>,
  ) => Promise<OpenAPIResponseTypes<S, Operation["responses"]>>,
) => Promise<OpenAPIResponseTypes<S, Operation["responses"]>>;

function createHandlerForOperation<
  S extends OpenAPISchema,
  P extends keyof S["paths"] & string,
  M extends keyof S["paths"][P] & OpenAPIMethods,
>(
  schema: S,
  opPath: P,
  opMethod: M,
  options: RequestOptions,
  middleware: OpenAPIHandlerMiddleware<S, GetOperationByPathAndMethod<S, P, M>>,
): OpenAPIClientOperationFunction<S, GetOperationByPathAndMethod<S, P, M>> {
  return (
    req: OpenAPIClientRequestParameters<
      S,
      GetOperationByPathAndMethod<S, P, M>
    >,
    perRequestMiddleware?: Array<
      OpenAPIHandlerMiddleware<S, GetOperationByPathAndMethod<S, P, M>>
    >,
  ) => {
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
    );
  };
}

export function createOpenAPIClient<S extends OpenAPISchema>(
  schema: S,
  options: RequestOptions,
  middleware?: Array<OpenAPIHandlerMiddleware<OpenAPISchema, OpenAPIOperation>>,
): OpenAPIClient<S> {
  const clientOperations: {
    [key: string]: { [key: string]: any } | any;
  } = {};

  // Make a single middleware function that calls each middleware in order
  const middlewareFn =
    middleware?.reduceRight(
      (prev, curr) => (req, next) => curr(req, prev.bind(null, req, next)),
      (req, next) => next(req),
    ) || ((req, next) => next(req));
  for (const opPath in schema.paths) {
    const asIndexedPath = opPath as keyof S["paths"] & string;
    const forPath = schema.paths[opPath];
    const functionsForPath: {
      [key: string]: OpenAPIClientOperationFunction<
        OpenAPISchema,
        OpenAPIOperation
      >;
    } = {};
    for (const opMethod in forPath) {
      const operation = forPath[opMethod];
      const handlerFunction = createHandlerForOperation(
        schema,
        opPath,
        opMethod as OpenAPIMethods,
        options,
        middlewareFn,
      ) as unknown as OpenAPIClientOperationFunction<
        OpenAPISchema,
        OpenAPIOperation
      >;
      functionsForPath[opMethod] = handlerFunction;
      clientOperations[operation.operationId] = handlerFunction;
    }
    clientOperations[asIndexedPath] = functionsForPath as Required<
      typeof functionsForPath
    >;
  }
  return clientOperations as OpenAPIClient<S>;
}
