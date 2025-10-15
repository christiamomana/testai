"use client";

import { useState, useEffect } from "react";
import UploadOpenApi from "./components/UploadOpenApi";
import EndpointList from "./components/EndpointList";
import SchemaExample from "./components/SchemaExample";
import PostmanCollection from "./components/PostmanCollection";
import {
  OpenAPIDocument,
  extractEndpoints,
  Endpoint,
} from "@/lib/openapiParser";

export default function Home() {
  const [api, setApi] = useState<OpenAPIDocument | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null
  );
  const [selectedEndpoints, setSelectedEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showPostmanGenerator, setShowPostmanGenerator] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  // Check for dark mode preference
  useEffect(() => {
    const darkModePreference = localStorage.getItem("darkMode");
    if (darkModePreference === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Check for system preference if no stored preference
    if (darkModePreference === null) {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(systemPrefersDark);
      if (systemPrefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Set base URL when API changes
  useEffect(() => {
    if (api && api.servers && api.servers.length > 0) {
      setBaseUrl(api.servers[0].url);
    } else {
      setBaseUrl("https://api.example.com");
    }
  }, [api]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  // Handle file upload
  const handleFileLoaded = async (apiDoc: OpenAPIDocument) => {
    setIsLoading(true);
    setApi(apiDoc);

    try {
      const extractedEndpoints = extractEndpoints(apiDoc);
      setEndpoints(extractedEndpoints);

      // Select first endpoint by default
      if (extractedEndpoints.length > 0) {
        setSelectedEndpoint(extractedEndpoints[0]);
      } else {
        setSelectedEndpoint(null);
      }

      // Reset selections
      setSelectedEndpoints([]);
      setShowPostmanGenerator(false);
    } catch (error) {
      console.error("Error processing OpenAPI file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle endpoint selection
  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
  };

  // Toggle endpoint selection for multi-select mode
  const handleToggleEndpointSelection = (endpoint: Endpoint) => {
    setSelectedEndpoints((prevSelected) => {
      const isSelected = prevSelected.some(
        (e) => e.path === endpoint.path && e.method === endpoint.method
      );

      if (isSelected) {
        return prevSelected.filter(
          (e) => e.path !== endpoint.path || e.method !== endpoint.method
        );
      } else {
        return [...prevSelected, endpoint];
      }
    });
  };

  // Toggle selection mode
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setShowPostmanGenerator(false);
    }
  };

  // Toggle Postman generator visibility
  const togglePostmanGenerator = () => {
    setShowPostmanGenerator(!showPostmanGenerator);
  };

  return (
    <main
      className={`min-h-screen ${
        isDarkMode ? "dark bg-gray-900 text-white" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">OpenAPI Example Generator</h1>

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-md ${
              isDarkMode
                ? "bg-gray-700 text-yellow-300"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {isDarkMode ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </header>

        <div className="mb-8">
          <UploadOpenApi
            onFileLoaded={handleFileLoaded}
            isLoading={isLoading}
          />
        </div>

        {api && (
          <div className="mb-4">
            <div
              className={`p-4 rounded-md ${
                isDarkMode ? "bg-gray-800" : "bg-blue-50"
              }`}
            >
              <h2 className="text-xl font-semibold">{api.info.title}</h2>
              <div className="flex items-center mt-1">
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Version: {api.info.version}
                </span>
                {api.info.description && (
                  <span
                    className={`mx-2 text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    •
                  </span>
                )}
                {api.info.description && (
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {api.info.description}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {endpoints.length > 0 && (
          <>
            {/* Postman Collection Generator Button */}
            {selectionMode && selectedEndpoints.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={togglePostmanGenerator}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {showPostmanGenerator ? "Ocultar" : "Mostrar"} Generador de
                  Colección Postman
                </button>
              </div>
            )}

            {/* Postman Collection Generator */}
            {showPostmanGenerator &&
              selectionMode &&
              selectedEndpoints.length > 0 && (
                <div className="mb-8">
                  <PostmanCollection
                    endpoints={selectedEndpoints}
                    api={api}
                    baseUrl={baseUrl}
                  />
                </div>
              )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2
                  className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Endpoints ({endpoints.length})
                </h2>
                <EndpointList
                  endpoints={endpoints}
                  onSelectEndpoint={handleSelectEndpoint}
                  selectedEndpoint={selectedEndpoint}
                  selectedEndpoints={selectedEndpoints}
                  onToggleEndpointSelection={handleToggleEndpointSelection}
                  selectionMode={selectionMode}
                  onToggleSelectionMode={handleToggleSelectionMode}
                />
              </div>

              <div>
                <h2
                  className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {selectionMode
                    ? "Selecciona endpoints para generar colección de Postman"
                    : "Ejemplo Generado"}
                </h2>
                {!selectionMode && selectedEndpoint ? (
                  <SchemaExample endpoint={selectedEndpoint} api={api} />
                ) : !selectionMode ? (
                  <div
                    className={`p-8 text-center ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-500"
                    } rounded-lg`}
                  >
                    Selecciona un endpoint para ver ejemplos
                  </div>
                ) : (
                  <div
                    className={`p-8 text-center ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-500"
                    } rounded-lg`}
                  >
                    {selectedEndpoints.length === 0 ? (
                      <p>
                        Selecciona endpoints para generar una colección de
                        Postman
                      </p>
                    ) : (
                      <p>
                        Has seleccionado {selectedEndpoints.length} endpoints
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
