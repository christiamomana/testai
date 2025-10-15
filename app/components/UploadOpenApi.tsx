"use client";

import { useState, useRef } from "react";
import { parseOpenAPIFile, OpenAPIDocument } from "@/lib/openapiParser";

interface UploadOpenApiProps {
  onFileLoaded: (api: OpenAPIDocument) => void;
  isLoading: boolean;
}

export default function UploadOpenApi({
  onFileLoaded,
  isLoading,
}: UploadOpenApiProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setFileName(file.name);

      const api = await parseOpenAPIFile(file);

      // Save to localStorage for later use
      localStorage.setItem("lastOpenApiFile", JSON.stringify(api));
      localStorage.setItem("lastOpenApiFileName", file.name);

      onFileLoaded(api);
    } catch (err) {
      console.error("Error loading OpenAPI file:", err);
      setError(
        "Error loading OpenAPI file. Please ensure it's a valid OpenAPI JSON file."
      );
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setFileName(file.name);

      const api = await parseOpenAPIFile(file);

      // Save to localStorage for later use
      localStorage.setItem("lastOpenApiFile", JSON.stringify(api));
      localStorage.setItem("lastOpenApiFileName", file.name);

      onFileLoaded(api);
    } catch (err) {
      console.error("Error loading OpenAPI file:", err);
      setError(
        "Error loading OpenAPI file. Please ensure it's a valid OpenAPI JSON file."
      );
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const loadFromLocalStorage = () => {
    const savedFile = localStorage.getItem("lastOpenApiFile");
    const savedFileName = localStorage.getItem("lastOpenApiFileName");

    if (savedFile && savedFileName) {
      try {
        const api = JSON.parse(savedFile) as OpenAPIDocument;
        setFileName(savedFileName);
        onFileLoaded(api);
      } catch (err) {
        console.error("Error loading saved OpenAPI file:", err);
        setError("Error loading saved OpenAPI file.");
      }
    } else {
      setError("No saved OpenAPI file found.");
    }
  };

  return (
    <div className="w-full">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {fileName ? (
          <div>
            <p className="text-sm text-gray-600">Archivo cargado:</p>
            <p className="font-medium text-gray-800">{fileName}</p>
            {isLoading ? (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <p className="text-sm text-green-600 mt-2">
                Archivo procesado correctamente
              </p>
            )}
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Arrastra y suelta un archivo OpenAPI JSON aquí, o
            </p>
            <p className="mt-1 text-sm text-blue-500">
              Haz clic para seleccionar un archivo
            </p>
          </div>
        )}
      </div>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            setFileName(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Limpiar
        </button>

        <button
          onClick={loadFromLocalStorage}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Cargar último archivo
        </button>
      </div>
    </div>
  );
}
