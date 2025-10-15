"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CollectionChat from "../components/CollectionChat";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

export default function CollectionEditorPage() {
  const [collection, setCollection] = useState<any>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"editor" | "json">("editor");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for dark mode preference
  useEffect(() => {
    const darkModePreference = localStorage.getItem("darkMode");
    if (darkModePreference === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (darkModePreference === "false") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Check for system preference if no stored preference
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(systemPrefersDark);
      if (systemPrefersDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Load collection from localStorage on component mount
  useEffect(() => {
    const savedCollection = localStorage.getItem("postmanCollection");

    if (savedCollection) {
      try {
        const parsedCollection = JSON.parse(savedCollection);
        setCollection(parsedCollection);
        setCollectionName(parsedCollection.info?.name || "Mi Colección");
      } catch (error) {
        console.error("Error parsing saved collection:", error);
      }
    } else {
      // Check if we have a collection ID in the URL
      const collectionId = searchParams.get("id");
      if (collectionId) {
        // In a real app, we would fetch the collection from an API
        // For now, we'll redirect back to home if no collection is found
        router.push("/");
      } else {
        router.push("/");
      }
    }
  }, [router, searchParams]);

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

  // Handle collection update
  const handleUpdateCollection = (updatedCollection: any) => {
    setCollection(updatedCollection);
    localStorage.setItem(
      "postmanCollection",
      JSON.stringify(updatedCollection)
    );
  };

  // Download the updated collection
  const downloadCollection = () => {
    if (!collection) return;

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

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen ${
        isDarkMode ? "dark bg-gray-900 text-white" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-800 mr-4"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">Editor de Colección</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={downloadCollection}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Descargar Colección
            </button>

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
          </div>
        </header>

        <div className="mb-6">
          <div
            className={`p-4 rounded-md ${
              isDarkMode ? "bg-gray-800" : "bg-blue-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {collection.info?.name || "Mi Colección"}
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {collection.info?.description || "Sin descripción"}
                </p>
              </div>

              <div className="text-sm">
                <span
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {collection.item?.length || 0} endpoints
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "editor"
                ? "bg-indigo-600 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-800"
            } rounded-l-md`}
          >
            Editor de Scripts
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "json"
                ? "bg-indigo-600 text-white"
                : isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-800"
            } rounded-r-md`}
          >
            Ver JSON
          </button>
        </div>

        {activeTab === "editor" ? (
          <CollectionChat
            collection={collection}
            onUpdateCollection={handleUpdateCollection}
          />
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-white text-black overflow-auto max-h-[600px]">
            <JsonView data={collection} />
          </div>
        )}
      </div>
    </main>
  );
}
