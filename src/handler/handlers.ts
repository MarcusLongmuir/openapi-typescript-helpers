import addFormats from "ajv-formats";
import type { JSONSchema7 } from "json-schema";

import type { DeepReadonly } from "../schema/DeepReadonly";
import type { GetOperationByPathAndMethod } from "../schema/helpers";
import type { OpenAPIMethods, OpenAPISchema } from "../schema/openapi-schema";
import type { RequestBodyTypeForOperation } from "../schema/request";
import type { OpenAPIResponseTypes } from "../schema/response";
import { createSchemaComponentValidator } from "../validation/createSchemaComponentValidator";
import { PathMatcher } from "./PathMatcher";
import { coerceParameter } from "./coerceParameter";
import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
  HandlerOptions,
  HandlerRequest,
} from "./handler-types";

export type OpenAPIHandler<OReq> = {
  opPath: string;
  opId: string;
  method: OpenAPIMethods;
  colonUrlPattern: string;
  baseUrl: string;
  handle: (
    req: GenericOpenAPIRequest,
    originalRequest: OReq,
  ) => Promise<GenericOpenAPIResponse>;
};

export function createHandler<
  S extends OpenAPISchema,
  P extends keyof S["paths"] & string,
  M extends keyof S["paths"][P] & OpenAPIMethods,
  OReq,
>(
  schema: S,
  opPath: P,
  method: M,
  options: HandlerOptions,
  handlerFunc: (
    req: HandlerRequest<S, P, M>,
    originalRequest: OReq,
  ) => Promise<
    OpenAPIResponseTypes<S, GetOperationByPathAndMethod<S, P, M>["responses"]>
  >,
): OpenAPIHandler<OReq> {
  const operation = schema.paths[opPath][method] as GetOperationByPathAndMethod<
    S,
    P,
    M
  >;
  if (!operation) {
    throw new Error(`Invalid path ${opPath} or method ${method}`);
  }
  let requestBodySchemaComponentSchema: DeepReadonly<JSONSchema7> | null = null;
  let isRequestBodyRequired = false;
  if (operation.requestBody?.required) {
    isRequestBodyRequired = true;
  }
  if (operation.requestBody?.content?.["application/json"]?.schema) {
    requestBodySchemaComponentSchema =
      operation.requestBody?.content?.["application/json"]?.schema;
  }

  const pathMatcher = new PathMatcher(opPath, options.baseUrl);

  const ajvInstance = createSchemaComponentValidator(schema);

  // Add formats such as "date-time" to the validator
  /*
   TODO - casting as any because the `ajv-formats` package is hoisted and is
    pointing to the hoisted version of `ajv` which has different types. Would
    be solved if this package was extracted into a separate repo.
  */
  addFormats(ajvInstance as any);

  const handle = async (
    req: GenericOpenAPIRequest,
    originalRequest: OReq,
  ): Promise<GenericOpenAPIResponse> => {
    const url = new URL(req.url);

    const patternResult = pathMatcher.exec(url);
    if (!patternResult) {
      throw new Error("URL path does not match handler");
    }

    if (req.method.toUpperCase() !== method.toUpperCase()) {
      throw new Error(
        `Expected method ${method.toUpperCase()} but got ${req.method}`,
      );
    }

    const parameters: { [key: string]: unknown } = {};

    const opParameters = operation.parameters || [];
    const parameterErrors: Array<string> = [];
    for (const parameter of opParameters) {
      if (parameter.in === "path") {
        const parameterValue = patternResult.pathname.groups[parameter.name];
        if (!parameterValue) {
          if (parameter.required) {
            parameterErrors.push(
              `Missing required path parameter ${parameter.name} in path ${opPath}`,
            );
          }
        } else {
          parameters[parameter.name] = coerceParameter(
            parameterValue,
            parameter.schema,
          );
        }
      } else if (parameter.in === "query") {
        const parameterValue = url.searchParams.get(parameter.name);
        if (!parameterValue) {
          if (parameter.required) {
            parameterErrors.push(
              `Missing required query parameter ${parameter.name}`,
            );
          }
        } else {
          parameters[parameter.name] = coerceParameter(
            parameterValue,
            parameter.schema,
          );
        }
      } else if (parameter.in === "header") {
        const parameterValue = req.headers.get(parameter.name);
        if (!parameterValue) {
          if (parameter.required) {
            parameterErrors.push(
              `Missing required header ${parameter.name} in headers`,
            );
          }
        } else {
          parameters[parameter.name] = coerceParameter(
            parameterValue,
            parameter.schema,
          );
        }
      }
    }
    if (parameterErrors.length > 0) {
      return {
        headers: new Headers(),
        body: { errors: parameterErrors },
        statusCode: 400,
      };
    }

    let requestBody: null | RequestBodyTypeForOperation<
      S,
      GetOperationByPathAndMethod<S, P, M>
    > = null;
    if (requestBodySchemaComponentSchema) {
      const requestBodyString = await req.bodyString();
      if (!requestBodyString) {
        if (isRequestBodyRequired) {
          return {
            headers: new Headers(),
            body: { errors: ["Missing required request body"] },
            statusCode: 400,
          };
        }
      } else {
        if (req.headers.get("content-type") !== "application/json") {
          return {
            headers: new Headers(),
            body: {
              errors: [
                `Expected content-type application/json but got ${req.headers.get(
                  "content-type",
                )}`,
              ],
            },
            statusCode: 400,
          };
        }
        try {
          requestBody = JSON.parse(requestBodyString);
        } catch {
          return {
            headers: new Headers(),
            body: {
              errors: ["Invalid JSON in request body"],
            },
            statusCode: 400,
          };
        }

        const bodyValidation = ajvInstance.validate(
          requestBodySchemaComponentSchema,
          requestBody,
        );
        if (!bodyValidation) {
          const bodyErrors = ajvInstance.errors || [];
          return {
            headers: new Headers(),
            body: { errors: bodyErrors },
            statusCode: 400,
          };
        }
      }
    }

    const reqObj = {
      parameters,
      op: operation,
      body: requestBody,
    };

    const responseObj = await handlerFunc(
      reqObj as HandlerRequest<S, P, M>,
      originalRequest,
    );

    let responseCode: number;
    if (typeof responseObj.code === "number") {
      responseCode = responseObj.code;
    } else if (typeof responseObj.code === "string") {
      responseCode = Number.parseInt(responseObj.code);
      if (Number.isNaN(responseCode)) {
        console.error(
          "Invalid response code - string was not a number",
          responseObj.code,
        );
        responseCode = 503;
      }
    } else {
      console.error("Invalid response code", responseObj.code);
      responseCode = 503;
    }

    const genericRes: GenericOpenAPIResponse = {
      statusCode: responseCode,
      headers: responseObj.headers
        ? new Headers(Object.entries(responseObj.headers))
        : new Headers(),
      body: responseObj.body || null,
    };
    return genericRes;
  };

  return {
    opPath,
    opId: operation.operationId,
    method,
    colonUrlPattern: pathMatcher.colonUrlPattern,
    handle,
    baseUrl: options.baseUrl || "",
  };
}
