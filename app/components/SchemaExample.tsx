"use client";

import { useState, useEffect } from "react";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { SchemaObject, Endpoint, OpenAPIDocument } from "@/lib/openapiParser";
import { generateFakeData, regenerateExample } from "@/lib/fakerGenerator";

interface SchemaExampleProps {
  endpoint: Endpoint;
  api: OpenAPIDocument | null;
}

export default function SchemaExample({ endpoint, api }: SchemaExampleProps) {
  const [activeTab, setActiveTab] = useState<"request" | "response" | "curl">(
    "curl"
  );
  const [requestExample, setRequestExample] = useState<any>(null);
  const [responseExample, setResponseExample] = useState<any>(null);
  const [curlCommand, setCurlCommand] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [selectedServerUrl, setSelectedServerUrl] = useState<string>("");
  const [customServerUrl, setCustomServerUrl] = useState<string>(
    "https://api.example.com"
  );
  const [availableServers, setAvailableServers] = useState<
    { url: string; description?: string }[]
  >([]);
  const [useCustomServer, setUseCustomServer] = useState<boolean>(false);

  // Set available servers when API changes
  useEffect(() => {
    if (api && api.servers && api.servers.length > 0) {
      setAvailableServers(api.servers);
      setSelectedServerUrl(api.servers[0].url);
      setUseCustomServer(false);
    } else {
      setAvailableServers([]);
      setSelectedServerUrl("");
      setUseCustomServer(true);
    }
  }, [api]);

  // Generate examples when endpoint changes or when server URL changes
  useEffect(() => {
    if (endpoint) {
      if (endpoint.requestSchema) {
        const requestData = generateFakeData(endpoint.requestSchema);
        setRequestExample(requestData);
        generateCurlCommand(requestData);
      } else {
        setRequestExample(null);
        generateCurlCommand(null);
      }

      if (endpoint.responseSchema) {
        setResponseExample(generateFakeData(endpoint.responseSchema));
      } else {
        setResponseExample(null);
      }

      // Default to curl tab
      setActiveTab("curl");
    }
  }, [endpoint, selectedServerUrl, customServerUrl, useCustomServer]);

  // Get the current base URL based on selection
  const getCurrentBaseUrl = (): string => {
    return useCustomServer ? customServerUrl : selectedServerUrl;
  };

  // Generate curl command based on endpoint and request data
  const generateCurlCommand = (requestData: any) => {
    const baseUrl = getCurrentBaseUrl();
    const url = `${baseUrl}${endpoint.path}`;
    let curl = `curl -X ${endpoint.method} "${url}"`;

    // Add headers
    curl += ` \\\n  -H "Content-Type: application/json"`;
    curl += ` \\\n  -H "Accept: application/json"`;

    // Add request body for methods that typically have one
    if (["POST", "PUT", "PATCH"].includes(endpoint.method) && requestData) {
      const jsonBody = JSON.stringify(requestData, null, 2);
      curl += ` \\\n  -d '${jsonBody}'`;
    }

    setCurlCommand(curl);
  };

  const handleRegenerateExample = () => {
    if (activeTab === "request" && endpoint.requestSchema) {
      const newRequestData = regenerateExample(endpoint.requestSchema);
      setRequestExample(newRequestData);
      generateCurlCommand(newRequestData);
    } else if (activeTab === "response" && endpoint.responseSchema) {
      setResponseExample(regenerateExample(endpoint.responseSchema));
    } else if (activeTab === "curl" && endpoint.requestSchema) {
      const newRequestData = regenerateExample(endpoint.requestSchema);
      setRequestExample(newRequestData);
      generateCurlCommand(newRequestData);
    }
  };

  const handleCopyToClipboard = () => {
    if (activeTab === "curl") {
      navigator.clipboard.writeText(curlCommand);
    } else {
      const example =
        activeTab === "request" ? requestExample : responseExample;
      if (example) {
        navigator.clipboard.writeText(JSON.stringify(example, null, 2));
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (activeTab === "curl") {
      const blob = new Blob([curlCommand], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${endpoint.path.replace(/\//g, "_")}_${
        endpoint.method
      }_curl.sh`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const example =
        activeTab === "request" ? requestExample : responseExample;
      if (example) {
        const blob = new Blob([JSON.stringify(example, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${endpoint.path.replace(/\//g, "_")}_${
          endpoint.method
        }_${activeTab}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const currentSchema =
    activeTab === "request" ? endpoint.requestSchema : endpoint.responseSchema;
  const currentExample =
    activeTab === "request" ? requestExample : responseExample;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTab === "curl"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => setActiveTab("curl")}
          >
            cURL
          </button>

          {endpoint.requestSchema && (
            <button
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTab === "request"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setActiveTab("request")}
            >
              Request JSON
            </button>
          )}

          {endpoint.responseSchema && (
            <button
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTab === "response"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setActiveTab("response")}
            >
              Response JSON
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleRegenerateExample}
            className="px-3 py-1 text-sm font-medium rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200"
            disabled={
              !(activeTab === "curl" ? endpoint.requestSchema : currentSchema)
            }
          >
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerar
            </div>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
            disabled={!(activeTab === "curl" ? curlCommand : currentExample)}
          >
            <div className="flex items-center">
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copiar
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
            disabled={!(activeTab === "curl" ? curlCommand : currentExample)}
          >
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Descargar
            </div>
          </button>
        </div>
      </div>

      {activeTab === "curl" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Base:
          </label>

          <div className="flex flex-col space-y-2">
            {/* Server selection */}
            {availableServers.length > 0 && (
              <div className="flex items-center">
                <input
                  type="radio"
                  id="useServerFromSpec"
                  name="serverSelection"
                  checked={!useCustomServer}
                  onChange={() => setUseCustomServer(false)}
                  className="mr-2"
                />
                <label htmlFor="useServerFromSpec" className="text-sm mr-2">
                  Usar servidor del OpenAPI:
                </label>
                <select
                  value={selectedServerUrl}
                  onChange={(e) => setSelectedServerUrl(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 text-black rounded-md"
                  disabled={useCustomServer}
                >
                  {availableServers.map((server, index) => (
                    <option key={index} value={server.url}>
                      {server.url}{" "}
                      {server.description ? `(${server.description})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom URL option */}
            <div className="flex items-center">
              <input
                type="radio"
                id="useCustomServer"
                name="serverSelection"
                checked={useCustomServer}
                onChange={() => setUseCustomServer(true)}
                className="mr-2"
              />
              <label htmlFor="useCustomServer" className="text-sm mr-2">
                URL personalizada:
              </label>
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
                disabled={!useCustomServer}
                placeholder="https://api.example.com"
              />
            </div>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {activeTab === "curl" ? (
          <div className="p-4 bg-gray-50 text-black overflow-auto max-h-[500px]">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {curlCommand}
            </pre>
          </div>
        ) : currentExample ? (
          <div className="p-4 bg-gray-50 text-black overflow-auto max-h-[500px]">
            <JsonView data={currentExample} />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {activeTab === "request" ? (
              <p>Este endpoint no tiene un schema de request definido</p>
            ) : (
              <p>Este endpoint no tiene un schema de response definido</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          {activeTab === "curl"
            ? "Comando cURL para"
            : activeTab === "request"
            ? "Request para"
            : "Response para"}{" "}
          <span className="font-medium">
            {endpoint.method} {endpoint.path}
          </span>
        </p>
        {endpoint.summary && <p className="mt-1">{endpoint.summary}</p>}
      </div>
    </div>
  );
}
