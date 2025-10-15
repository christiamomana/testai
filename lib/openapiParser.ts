import SwaggerParser from "@apidevtools/swagger-parser";

export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Server[];
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
}

export interface OperationObject {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  tags?: string[];
}

export interface ParameterObject {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, MediaTypeObject>;
  required?: boolean;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: any;
  examples?: Record<string, any>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: any[];
  nullable?: boolean;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  description?: string;
  default?: any;
  example?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
}

export interface Endpoint {
  path: string;
  method: string;
  summary?: string;
  operationId?: string;
  requestSchema?: SchemaObject;
  responseSchema?: SchemaObject;
  tags?: string[];
}

export async function parseOpenAPIFile(file: File): Promise<OpenAPIDocument> {
  try {
    const fileContent = await readFileAsText(file);
    const jsonContent = JSON.parse(fileContent);

    // Validate and dereference the OpenAPI document
    const api = (await SwaggerParser.validate(jsonContent)) as OpenAPIDocument;
    const dereferenced = (await SwaggerParser.dereference(
      jsonContent
    )) as OpenAPIDocument;

    return dereferenced;
  } catch (error) {
    console.error("Error parsing OpenAPI file:", error);
    throw new Error("Invalid OpenAPI file");
  }
}

export function extractEndpoints(api: OpenAPIDocument): Endpoint[] {
  const endpoints: Endpoint[] = [];

  Object.entries(api.paths).forEach(([path, pathItem]) => {
    const methods = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
      "trace",
    ];

    methods.forEach((method) => {
      const operation = pathItem[method as keyof PathItem];
      if (operation) {
        const endpoint: Endpoint = {
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
          operationId: operation.operationId,
          tags: operation.tags,
        };

        // Extract request schema if available
        if (operation.requestBody?.content) {
          const contentType = Object.keys(operation.requestBody.content)[0];
          if (
            contentType &&
            operation.requestBody.content[contentType].schema
          ) {
            endpoint.requestSchema =
              operation.requestBody.content[contentType].schema;
          }
        }

        // Extract response schema if available (prioritize 200 response)
        if (operation.responses) {
          const responseCode =
            operation.responses["200"] ||
            operation.responses["201"] ||
            operation.responses["default"] ||
            Object.values(operation.responses)[0];

          if (responseCode?.content) {
            const contentType = Object.keys(responseCode.content)[0];
            if (contentType && responseCode.content[contentType].schema) {
              endpoint.responseSchema =
                responseCode.content[contentType].schema;
            }
          }
        }

        endpoints.push(endpoint);
      }
    });
  });

  return endpoints;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
