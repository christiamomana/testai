"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Endpoint, OpenAPIDocument } from "@/lib/openapiParser";
import { generateFakeData } from "@/lib/fakerGenerator";

interface PostmanCollectionProps {
  endpoints: Endpoint[];
  api: OpenAPIDocument | null;
  baseUrl: string;
}

interface PostmanVariable {
  key: string;
  value: string;
  type: string;
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: Array<{
      key: string;
      value: string;
      type: string;
    }>;
    url: {
      raw: string;
      host: string[];
      path: string[];
      variable?: Array<{
        key: string;
        value: string;
      }>;
    };
    body?: {
      mode: string;
      raw: string;
      options?: {
        raw: {
          language: string;
        };
      };
    };
  };
  response: any[];
}

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  item: PostmanRequest[];
  variable: PostmanVariable[];
}

export default function PostmanCollection({
  endpoints,
  api,
  baseUrl,
}: PostmanCollectionProps) {
  const [collectionName, setCollectionName] = useState(
    api?.info?.title || "OpenAPI Collection"
  );
  const [collectionDescription, setCollectionDescription] = useState(
    api?.info?.description || "Generated from OpenAPI"
  );
  const router = useRouter();

  // Generate Postman collection from selected endpoints
  const generatePostmanCollection = (): PostmanCollection => {
    // Variables to store in the collection
    const variables: PostmanVariable[] = [];
    const variableMap = new Map<string, string>();
    let variableCounter = 1;

    // Create Postman requests for each endpoint
    const items: PostmanRequest[] = endpoints.map((endpoint) => {
      // Parse the path to extract path parameters
      const pathParts = endpoint.path
        .split("/")
        .filter((part) => part.length > 0);

      // Replace path parameters with Postman variables
      const postmanPathParts = pathParts.map((part) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          const paramName = part.substring(1, part.length - 1);
          const varName = `path_${paramName}`;

          // Add to variables if not already there
          if (!variableMap.has(varName)) {
            const value = `{{${varName}}}`;
            variables.push({
              key: varName,
              value: "example_value",
              type: "string",
            });
            variableMap.set(varName, value);
          }

          return `{{${varName}}}`;
        }
        return part;
      });

      // Generate request body with Faker data if available
      let body;
      if (
        ["POST", "PUT", "PATCH"].includes(endpoint.method) &&
        endpoint.requestSchema
      ) {
        const fakeData = generateFakeData(endpoint.requestSchema);
        const processedData = processObjectForVariables(
          fakeData,
          variables,
          variableMap,
          variableCounter
        );
        variableCounter = processedData.counter;

        body = {
          mode: "raw",
          raw: JSON.stringify(processedData.data, null, 2),
          options: {
            raw: {
              language: "json",
            },
          },
        };
      }

      // Create the Postman request object
      const request: PostmanRequest = {
        name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        request: {
          method: endpoint.method,
          header: [
            {
              key: "Content-Type",
              value: "application/json",
              type: "text",
            },
            {
              key: "Accept",
              value: "application/json",
              type: "text",
            },
          ],
          url: {
            raw: `${baseUrl}/${postmanPathParts.join("/")}`,
            host: [baseUrl],
            path: postmanPathParts,
          },
          ...(body && { body }),
        },
        response: [],
      };

      return request;
    });

    // Create the full Postman collection
    return {
      info: {
        name: collectionName,
        description: collectionDescription,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: items,
      variable: variables,
    };
  };

  // Process object to replace values with variables
  const processObjectForVariables = (
    obj: any,
    variables: PostmanVariable[],
    variableMap: Map<string, string>,
    counter: number
  ): { data: any; counter: number } => {
    if (!obj || typeof obj !== "object") {
      return { data: obj, counter };
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const result = [];
      for (const item of obj) {
        const processed = processObjectForVariables(
          item,
          variables,
          variableMap,
          counter
        );
        counter = processed.counter;
        result.push(processed.data);
      }
      return { data: result, counter };
    }

    // Handle objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // For primitive values, create variables
      if (
        value !== null &&
        typeof value !== "object" &&
        typeof value !== "function"
      ) {
        const varName = `data_${key}_${counter++}`;
        const varValue = `{{${varName}}}`;

        // Add to variables if not already there
        if (!variableMap.has(varName)) {
          variables.push({
            key: varName,
            value: String(value),
            type: typeof value,
          });
          variableMap.set(varName, varValue);
        }

        result[key] = varValue;
      } else {
        // For nested objects or arrays, process recursively
        const processed = processObjectForVariables(
          value,
          variables,
          variableMap,
          counter
        );
        counter = processed.counter;
        result[key] = processed.data;
      }
    }

    return { data: result, counter };
  };

  // Download the Postman collection
  const downloadCollection = () => {
    const collection = generatePostmanCollection();
    const json = JSON.stringify(collection, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${collectionName.replace(
      /\s+/g,
      "_"
    )}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save collection to localStorage and navigate to editor
  const saveAndEditCollection = () => {
    const collection = generatePostmanCollection();
    localStorage.setItem("postmanCollection", JSON.stringify(collection));
    router.push("/collection-editor");
  };

  return (
    <div className="w-full">
      <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Generar Colección de Postman
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la colección:
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción:
          </label>
          <textarea
            value={collectionDescription}
            onChange={(e) => setCollectionDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Endpoints seleccionados:</strong> {endpoints.length}
          </div>
          <ul className="text-sm text-gray-600 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
            {endpoints.map((endpoint, index) => (
              <li key={index} className="mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium 
                  ${
                    endpoint.method === "GET"
                      ? "bg-blue-100 text-blue-800"
                      : endpoint.method === "POST"
                      ? "bg-green-100 text-green-800"
                      : endpoint.method === "PUT"
                      ? "bg-yellow-100 text-yellow-800"
                      : endpoint.method === "DELETE"
                      ? "bg-red-100 text-red-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {endpoint.method}
                </span>
                <span className="ml-2 font-mono">{endpoint.path}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>
              Se generarán variables de Postman para todos los datos generados
              con Faker.
            </p>
            <p>
              Estas variables pueden ser modificadas posteriormente en Postman.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={saveAndEditCollection}
              disabled={endpoints.length === 0}
              className={`px-4 py-2 rounded-md font-medium ${
                endpoints.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Editar con Asistente IA
            </button>

            <button
              onClick={downloadCollection}
              disabled={endpoints.length === 0}
              className={`px-4 py-2 rounded-md font-medium ${
                endpoints.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              Descargar Colección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
