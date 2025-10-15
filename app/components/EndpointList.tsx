"use client";

import { useState, useMemo } from "react";
import { Endpoint } from "@/lib/openapiParser";

interface EndpointListProps {
  endpoints: Endpoint[];
  onSelectEndpoint: (endpoint: Endpoint) => void;
  selectedEndpoint: Endpoint | null;
  selectedEndpoints: Endpoint[];
  onToggleEndpointSelection: (endpoint: Endpoint) => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export default function EndpointList({
  endpoints,
  onSelectEndpoint,
  selectedEndpoint,
  selectedEndpoints,
  onToggleEndpointSelection,
  selectionMode,
  onToggleSelectionMode,
}: EndpointListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Extract unique tags from all endpoints
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    endpoints.forEach((endpoint) => {
      if (endpoint.tags && endpoint.tags.length > 0) {
        endpoint.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [endpoints]);

  // Filter endpoints based on search term and method filter
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((endpoint) => {
      const matchesSearch =
        searchTerm === "" ||
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.operationId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        methodFilter === null || endpoint.method === methodFilter;

      const matchesTag =
        tagFilter === null ||
        (endpoint.tags && endpoint.tags.includes(tagFilter));

      return matchesSearch && matchesMethod && matchesTag;
    });
  }, [endpoints, searchTerm, methodFilter, tagFilter]);

  // Check if an endpoint is selected in multi-select mode
  const isEndpointSelected = (endpoint: Endpoint): boolean => {
    return selectedEndpoints.some(
      (e) => e.path === endpoint.path && e.method === endpoint.method
    );
  };

  // Get HTTP method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle endpoint click based on mode
  const handleEndpointClick = (endpoint: Endpoint) => {
    if (selectionMode) {
      onToggleEndpointSelection(endpoint);
    } else {
      onSelectEndpoint(endpoint);
    }
  };

  // Select all filtered endpoints
  const selectAllFiltered = () => {
    filteredEndpoints.forEach((endpoint) => {
      if (!isEndpointSelected(endpoint)) {
        onToggleEndpointSelection(endpoint);
      }
    });
  };

  // Deselect all endpoints
  const deselectAll = () => {
    selectedEndpoints.forEach((endpoint) => {
      onToggleEndpointSelection(endpoint);
    });
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar endpoints..."
            className="w-full p-2 pl-8 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setMethodFilter(null)}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            methodFilter === null
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          ALL
        </button>
        {["GET", "POST", "PUT", "DELETE", "PATCH"].map((method) => (
          <button
            key={method}
            onClick={() =>
              setMethodFilter(methodFilter === method ? null : method)
            }
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              methodFilter === method
                ? getMethodColor(method)
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {availableTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por tag:
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={tagFilter || ""}
            onChange={(e) => setTagFilter(e.target.value || null)}
          >
            <option value="">Todos los tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onToggleSelectionMode}
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              selectionMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {selectionMode ? "Modo selección múltiple" : "Modo selección única"}
          </button>
        </div>

        {selectionMode && (
          <div className="flex space-x-2">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
            >
              Seleccionar todos
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"
            >
              Deseleccionar todos
            </button>
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-gray-100">
              {selectedEndpoints.length} seleccionados
            </span>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        {filteredEndpoints.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredEndpoints.map((endpoint, index) => (
              <li
                key={`${endpoint.method}-${endpoint.path}-${index}`}
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectionMode
                    ? isEndpointSelected(endpoint)
                      ? "bg-indigo-50"
                      : ""
                    : selectedEndpoint &&
                      selectedEndpoint.path === endpoint.path &&
                      selectedEndpoint.method === endpoint.method
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => handleEndpointClick(endpoint)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={isEndpointSelected(endpoint)}
                          onChange={() => onToggleEndpointSelection(endpoint)}
                          className="mr-3 h-4 w-4 text-indigo-600 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getMethodColor(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="ml-2 text-sm font-mono text-gray-800">
                        {endpoint.path}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {endpoint.tags &&
                        endpoint.tags.map((tag) => (
                          <span
                            key={tag}
                            className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>

                  {endpoint.summary && (
                    <p className="mt-1 text-xs text-gray-500">
                      {endpoint.summary}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No se encontraron endpoints
          </div>
        )}
      </div>
    </div>
  );
}
