import type {
  GetOperationByPathAndMethod,
  OpenAPIMethods,
  OpenAPIResponseTypes,
  OpenAPISchema,
  RequestBodyTypeForOperation,
  TypeForAllParams,
} from "../schema";
import type { RequestOptions } from "./requestOptions";

export async function makeOpenAPIRequest<
  S extends OpenAPISchema,
  P extends keyof S["paths"] & string,
  M extends keyof S["paths"][P] & OpenAPIMethods,
>(
  schema: S,
  opPath: P,
  method: M,
  options: RequestOptions,
  req: {
    headers?: Headers;
    parameters: TypeForAllParams<S, GetOperationByPathAndMethod<S, P, M>>;
    abortSignal?: AbortSignal;
    body: GetOperationByPathAndMethod<S, P, M> extends {
      requestBody: { required: true };
    }
      ? RequestBodyTypeForOperation<S, GetOperationByPathAndMethod<S, P, M>>
      :
          | RequestBodyTypeForOperation<S, GetOperationByPathAndMethod<S, P, M>>
          | undefined;
  },
): Promise<
  OpenAPIResponseTypes<S, GetOperationByPathAndMethod<S, P, M>["responses"]>
> {
  const operation = schema.paths[opPath][method] as GetOperationByPathAndMethod<
    S,
    P,
    M
  >;
  if (!operation) {
    throw new Error(`Invalid path ${opPath} or method ${method}`);
  }

  let urlPath: string = opPath;
  const urlSearchParams: { [key: string]: string } = {};
  const headerParams: { [key: string]: string } = {};

  const opParameters = operation.parameters || [];
  for (const parameter of opParameters) {
    const paramName = parameter.name as keyof TypeForAllParams<
      S,
      GetOperationByPathAndMethod<S, P, M>
    >;
    const parameterValue = req.parameters[paramName];
    if (!parameterValue) {
      if (parameter.required) {
        throw new Error(`Missing required parameter ${parameter.name}`);
      }
    } else {
      if (parameter.in === "path") {
        urlPath = urlPath.replace(`{${paramName}}`, parameterValue.toString());
      } else if (parameter.in === "query") {
        urlSearchParams[paramName] = parameterValue.toString();
      } else if (parameter.in === "header") {
        headerParams[paramName] = parameterValue.toString();
      }
    }
  }

  const url = new URL(`${options.baseUrl}${urlPath}`);
  for (const paramName in urlSearchParams) {
    url.searchParams.set(paramName, urlSearchParams[paramName]);
  }
  const headers = req.headers || new Headers();

  for (const paramName in headerParams) {
    headers.append(paramName, headerParams[paramName]);
  }
  if (req.body) {
    headers.set("Content-Type", "application/json");
  }
  const request = new Request(url.toString(), {
    method,
    headers,
    body: req.body ? JSON.stringify(req.body) : undefined,
  });

  let fetchResponse: Response;
  if (options.fetchOverride) {
    fetchResponse = await options.fetchOverride(request);
  } else {
    fetchResponse = await fetch(request, {
      signal: req.abortSignal,
    });
  }
  const responseBodyText = await fetchResponse.text();
  let responseBodyJson = null as RequestBodyTypeForOperation<
    S,
    GetOperationByPathAndMethod<S, P, M>
  >;
  if (responseBodyText) {
    responseBodyJson = JSON.parse(responseBodyText);
  }

  const responseHeaders: { [key: string]: string } = {};
  fetchResponse.headers.forEach((val, key) => {
    responseHeaders[key] = val;
  });

  const response = {
    code: fetchResponse.status,
    headers: responseHeaders,
    body: responseBodyJson,
  } as OpenAPIResponseTypes<
    S,
    GetOperationByPathAndMethod<S, P, M>["responses"]
  >;

  return response;
}
