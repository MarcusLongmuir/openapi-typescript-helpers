const rootSchema = {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Swagger Petstore",
    description:
      "A sample API that uses a petstore as an example to demonstrate features in the OpenAPI 3.0 specification",
    termsOfService: "http://swagger.io/terms/",
    contact: {
      name: "Swagger API Team",
      email: "apiteam@swagger.io",
      url: "http://swagger.io",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
  },
  servers: [
    {
      url: "https://petstore.swagger.io/v2",
    },
  ],
  paths: {
    "/stats": {
      post: {
        description: "Returns stats",
        operationId: "getStats",
        requestBody: {
          description: "Stat types to return",
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["includeCategories"],
                properties: {
                  includeCategories: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "stats response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Stats",
                },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/get-obj": {
      post: {
        description: "Returns an object",
        operationId: "getObj",
        responses: {
          200: {
            description: "obj response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["childObj"],
                  properties: {
                    childObj: {
                      type: "object",
                      required: ["a", "b"],
                      properties: {
                        a: {
                          type: "string",
                        },
                        b: {
                          type: "integer",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        description: "Deletes an object",
        operationId: "deleteObj",
        responses: {
          204: {
            description: "delete obj response",
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/pets": {
      get: {
        description:
          "Returns all pets from the system that the user has access to\nNam sed condimentum est. Maecenas tempor sagittis sapien, nec rhoncus sem sagittis sit amet. Aenean at gravida augue, ac iaculis sem. Curabitur odio lorem, ornare eget elementum nec, cursus id lectus. Duis mi turpis, pulvinar ac eros ac, tincidunt varius justo. In hac habitasse platea dictumst. Integer at adipiscing ante, a sagittis ligula. Aenean pharetra tempor ante molestie imperdiet. Vivamus id aliquam diam. Cras quis velit non tortor eleifend sagittis. Praesent at enim pharetra urna volutpat venenatis eget eget mauris. In eleifend fermentum facilisis. Praesent enim enim, gravida ac sodales sed, placerat id erat. Suspendisse lacus dolor, consectetur non augue vel, vehicula interdum libero. Morbi euismod sagittis libero sed lacinia.\n\nSed tempus felis lobortis leo pulvinar rutrum. Nam mattis velit nisl, eu condimentum ligula luctus nec. Phasellus semper velit eget aliquet faucibus. In a mattis elit. Phasellus vel urna viverra, condimentum lorem id, rhoncus nibh. Ut pellentesque posuere elementum. Sed a varius odio. Morbi rhoncus ligula libero, vel eleifend nunc tristique vitae. Fusce et sem dui. Aenean nec scelerisque tortor. Fusce malesuada accumsan magna vel tempus. Quisque mollis felis eu dolor tristique, sit amet auctor felis gravida. Sed libero lorem, molestie sed nisl in, accumsan tempor nisi. Fusce sollicitudin massa ut lacinia mattis. Sed vel eleifend lorem. Pellentesque vitae felis pretium, pulvinar elit eu, euismod sapien.",
        operationId: "findPets",
        parameters: [
          {
            name: "tags",
            in: "query",
            description: "tags to filter by",
            required: false,
            style: "form",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          {
            name: "x-request-id",
            in: "header",
            required: true,
            style: "form",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
          {
            name: "limit",
            in: "query",
            description: "maximum number of results to return",
            required: false,
            schema: {
              type: "integer",
              format: "int32",
            },
          },
        ],
        responses: {
          200: {
            description: "pet response",
            headers: {
              "x-next": {
                description: "A link to the next page of responses",
                schema: {
                  type: "string",
                },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        description: "Creates a new pet in the store. Duplicates are allowed",
        operationId: "addPet",
        requestBody: {
          description: "Pet to add to the store",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewPet",
              },
            },
          },
        },
        responses: {
          200: {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/bulk-pets": {
      post: {
        description: "Adds multiple pets to the store",
        operationId: "bulkAddPets",
        requestBody: {
          description: "Pets to add to the store",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/pets/{id}": {
      get: {
        description:
          "Returns a user based on a single ID, if the user does not have access to the pet",
        operationId: "find pet by id",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to fetch",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          200: {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        description: "Updates a pet in the store only if it exists",
        operationId: "updatePet",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to fetch",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        requestBody: {
          description: "Pet to update in the store",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Pet",
              },
            },
          },
        },
        responses: {
          200: {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        description: "deletes a single pet based on the ID supplied",
        operationId: "deletePet",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to delete",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          204: {
            description: "pet deleted",
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    responses: {
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
    },
    schemas: {
      Pet: {
        allOf: [
          {
            $ref: "#/components/schemas/NewPet",
          },
          {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "integer",
                format: "int64",
              },
            },
          },
        ],
      },
      Stats: {
        type: "object",
        required: ["totalCount"],
        properties: {
          totalCount: {
            type: "integer",
            format: "int64",
          },
          uniqueCategories: {
            type: "integer",
            format: "int64",
          },
        },
      },
      NewPet: {
        type: "object",
        required: ["name", "birthDate"],
        properties: {
          name: {
            type: "string",
          },
          tag: {
            type: "string",
          },
          birthDate: {
            type: "string",
            format: "date-time",
          },
        },
      },
      Error: {
        type: "object",
        additionalProperties: false,
        required: ["message"],
        properties: {
          message: {
            type: "string",
          },
        },
      },
      SomeAnyOf: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "someId"],
            properties: {
              someId: {
                type: "string",
              },
              parameters: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              type: {
                type: "string",
                enum: ["referenceOfId"],
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "directValue"],
            properties: {
              type: {
                type: "string",
                enum: ["direct"],
              },
              directValue: {
                type: "string",
              },
            },
          },
        ],
      },
      SomeOneOf: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "someId"],
            properties: {
              someId: {
                type: "string",
              },
              parameters: {
                type: "object",
                additionalProperties: {
                  type: "string",
                },
              },
              type: {
                type: "string",
                enum: ["referenceOfId"],
              },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "directValue"],
            properties: {
              type: {
                type: "string",
                enum: ["direct"],
              },
              directValue: {
                type: "string",
              },
            },
          },
        ],
      },
    },
  },
} as const;

type SchemaType = Readonly<typeof rootSchema>;
export const schema: SchemaType = rootSchema;
