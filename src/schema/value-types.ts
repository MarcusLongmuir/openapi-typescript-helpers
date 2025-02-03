import type { ComponentDefinitionFromString } from "./helpers";
import type {
  OpenAPIComponentDefinition,
  OpenAPISchema,
} from "./openapi-schema";

export type AllOfToIntersection<
  S extends OpenAPISchema,
  T extends ReadonlyArray<OpenAPIComponentDefinition>,
> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends OpenAPIComponentDefinition
    ? Tail extends OpenAPIComponentDefinition[]
      ? ToValueType<S, Head> & AllOfToIntersection<S, Tail>
      : ToValueType<S, Head>
    : unknown
  : unknown;

export type AllOfToUnion<
  S extends OpenAPISchema,
  T extends ReadonlyArray<OpenAPIComponentDefinition>,
> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends OpenAPIComponentDefinition
    ? Tail extends OpenAPIComponentDefinition[]
      ? ToValueType<S, Head> | AllOfToUnion<S, Tail>
      : ToValueType<S, Head>
    : unknown
  : never;

export type ToValueType<
  S extends OpenAPISchema,
  C extends OpenAPIComponentDefinition | undefined,
> = C extends {
  enum: ReadonlyArray<infer E>;
}
  ? E
  : C extends {
        type: "string";
        separator: string;
      }
    ? Array<string>
    : C extends {
          type: "string";
        }
      ? string
      : C extends {
            type: "null";
          }
        ? null
        : C extends { type: "integer" }
          ? number
          : C extends { type: "number" }
            ? number
            : C extends { type: "boolean" }
              ? boolean
              : C extends { type: "array"; items: OpenAPIComponentDefinition }
                ? Array<ToValueType<S, C["items"]>>
                : C extends {
                      $ref: `#/components/schemas/${infer R}`;
                    }
                  ? ToValueType<S, ComponentDefinitionFromString<S, R>>
                  : C extends {
                        type: "object";
                        properties: Record<string, OpenAPIComponentDefinition>;
                        required: ReadonlyArray<string>;
                      }
                    ? {
                        [key in Exclude<
                          keyof C["properties"],
                          C["required"][number]
                        >]?: ToValueType<S, C["properties"][key]>; // Optional properties
                      } & {
                        [key in Extract<
                          keyof C["properties"],
                          C["required"][number]
                        >]: ToValueType<S, C["properties"][key]>; // Required properties
                      } & (C extends {
                          additionalProperties: OpenAPIComponentDefinition;
                        }
                          ? {
                              [key: string]: ToValueType<
                                S,
                                C["additionalProperties"]
                              >;
                            }
                          : object)
                    : C extends {
                          type: "object";
                          properties: Record<
                            string,
                            OpenAPIComponentDefinition
                          >;
                        }
                      ? {
                          [key in keyof C["properties"]]?: ToValueType<
                            S,
                            C["properties"][key]
                          >; // Optional properties
                        } & (C extends {
                          additionalProperties: OpenAPIComponentDefinition;
                        }
                          ? {
                              [key: string]: ToValueType<
                                S,
                                C["additionalProperties"]
                              >;
                            }
                          : object)
                      : C extends {
                            type: "object";
                            additionalProperties: OpenAPIComponentDefinition;
                          }
                        ? {
                            [key: string]: ToValueType<
                              S,
                              C["additionalProperties"]
                            >;
                          }
                        : C extends {
                              type: "object";
                              additionalProperties: true;
                            }
                          ? object
                          : C extends {
                                allOf: ReadonlyArray<OpenAPIComponentDefinition>;
                              }
                            ? AllOfToIntersection<S, C["allOf"]>
                            : C extends {
                                  anyOf: ReadonlyArray<OpenAPIComponentDefinition>;
                                }
                              ? AllOfToUnion<S, C["anyOf"]>
                              : C extends {
                                    oneOf: ReadonlyArray<OpenAPIComponentDefinition>;
                                  }
                                ? AllOfToUnion<S, C["oneOf"]>
                                : C extends { type: string }
                                  ? unknown
                                  : C extends object // Explict support for "any"
                                    ? any
                                    : never;
