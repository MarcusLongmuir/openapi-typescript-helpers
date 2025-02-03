import type {
  GetOperationByPathAndMethod,
  OpenAPIMethods,
  OpenAPISchema,
  RequestBodyTypeForOperation,
  TypeForAllParams,
} from "../schema";

export type GenericOpenAPIRequest = {
  url: string;
  method: string;
  headers: Headers;
  bodyString(): Promise<string>;
};

export type GenericOpenAPIResponse = {
  statusCode: number;
  headers: Headers;
  body: any;
};

export type HandlerRequest<
  S extends OpenAPISchema,
  P extends keyof S["paths"],
  M extends keyof S["paths"][P] & OpenAPIMethods,
> = {
  readonly parameters: TypeForAllParams<
    S,
    GetOperationByPathAndMethod<S, P, M>
  >;
  readonly op: GetOperationByPathAndMethod<S, P, M>;
  readonly body: GetOperationByPathAndMethod<S, P, M> extends {
    requestBody: { required: true };
  }
    ? RequestBodyTypeForOperation<S, GetOperationByPathAndMethod<S, P, M>>
    :
        | RequestBodyTypeForOperation<S, GetOperationByPathAndMethod<S, P, M>>
        | undefined;
};

export type HandlerOptions = {
  baseUrl?: string;
};
