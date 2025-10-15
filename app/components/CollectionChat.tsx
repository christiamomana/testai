"use client";

import { useState, useRef, useEffect } from "react";
import { getChatCompletion } from "@/lib/aiService";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface CollectionChatProps {
  collection: any;
  onUpdateCollection: (updatedCollection: any) => void;
}

export default function CollectionChat({
  collection,
  onUpdateCollection,
}: CollectionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "¡Hola! Soy tu asistente para modificar la colección de Postman. Puedes pedirme que agregue scripts de pre-request o post-response, o que modifique cualquier aspecto de la colección.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [scriptType, setScriptType] = useState<"pre-request" | "test">(
    "pre-request"
  );
  const [scriptContent, setScriptContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract endpoints from collection for the dropdown
  const endpoints =
    collection?.item?.map((item: any, index: number) => ({
      id: index,
      name: item.name,
      method: item.request.method,
      path: item.request.url.raw,
    })) || [];

  // Handle sending message to AI assistant
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get all messages for context
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      chatHistory.push({
        role: userMessage.role,
        content: userMessage.content,
      });

      // Get AI response with collection context
      const aiResponse = await getChatCompletion(chatHistory, collection);

      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, ocurrió un error al procesar tu solicitud.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle endpoint selection
  const handleEndpointSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEndpoint(value === "" ? null : value);

    // Reset script content when changing endpoint
    setScriptContent("");

    // Load existing script if available
    if (value !== "") {
      const index = parseInt(value);
      const item = collection.item[index];

      if (
        scriptType === "pre-request" &&
        item.event?.some((e: any) => e.listen === "prerequest")
      ) {
        const script =
          item.event
            .find((e: any) => e.listen === "prerequest")
            ?.script?.exec?.join("\n") || "";
        setScriptContent(script);
      } else if (
        scriptType === "test" &&
        item.event?.some((e: any) => e.listen === "test")
      ) {
        const script =
          item.event
            .find((e: any) => e.listen === "test")
            ?.script?.exec?.join("\n") || "";
        setScriptContent(script);
      }
    }
  };

  // Handle script type selection
  const handleScriptTypeChange = (type: "pre-request" | "test") => {
    setScriptType(type);

    // Reset script content when changing type
    setScriptContent("");

    // Load existing script if available
    if (selectedEndpoint !== null) {
      const index = parseInt(selectedEndpoint);
      const item = collection.item[index];

      if (
        type === "pre-request" &&
        item.event?.some((e: any) => e.listen === "prerequest")
      ) {
        const script =
          item.event
            .find((e: any) => e.listen === "prerequest")
            ?.script?.exec?.join("\n") || "";
        setScriptContent(script);
      } else if (
        type === "test" &&
        item.event?.some((e: any) => e.listen === "test")
      ) {
        const script =
          item.event
            .find((e: any) => e.listen === "test")
            ?.script?.exec?.join("\n") || "";
        setScriptContent(script);
      }
    }
  };

  // Apply code from chat to script editor
  const applyCodeFromChat = (code: string) => {
    if (!code) return;

    // Extract code from markdown code blocks if present
    const codeBlockRegex = /```(?:javascript)?\n([\s\S]*?)\n```/;
    const match = code.match(codeBlockRegex);

    if (match && match[1]) {
      setScriptContent(match[1].trim());
    } else {
      setScriptContent(code);
    }

    // Add confirmation message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: "Código aplicado al editor de scripts.",
        timestamp: new Date(),
      },
    ]);
  };

  // Save script to collection
  const handleSaveScript = () => {
    if (selectedEndpoint === null) return;

    const index = parseInt(selectedEndpoint);
    const updatedCollection = { ...collection };

    // Ensure item has an event array
    if (!updatedCollection.item[index].event) {
      updatedCollection.item[index].event = [];
    }

    // Check if script already exists
    const eventType = scriptType === "pre-request" ? "prerequest" : "test";
    const existingScriptIndex = updatedCollection.item[index].event.findIndex(
      (e: any) => e.listen === eventType
    );

    const scriptObject = {
      listen: eventType,
      script: {
        type: "text/javascript",
        exec: scriptContent.split("\n"),
      },
    };

    if (existingScriptIndex >= 0) {
      // Update existing script
      updatedCollection.item[index].event[existingScriptIndex] = scriptObject;
    } else {
      // Add new script
      updatedCollection.item[index].event.push(scriptObject);
    }

    // Update collection
    onUpdateCollection(updatedCollection);

    // Add confirmation message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Script de ${
          scriptType === "pre-request" ? "pre-request" : "test"
        } guardado para el endpoint "${updatedCollection.item[index].name}".`,
        timestamp: new Date(),
      },
    ]);

    // Add message to chat about the update to help the AI understand what changed
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `Se ha actualizado el endpoint "${
          updatedCollection.item[index].name
        }" con un script de ${
          scriptType === "pre-request" ? "pre-request" : "test"
        }.`,
        timestamp: new Date(),
      },
    ]);
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format message content with syntax highlighting for code blocks
  const formatMessageContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // This is a code block
        const code = part.slice(3, -3).trim();
        const language = code.split("\n")[0].trim();
        const codeContent = language
          ? code.substring(language.length).trim()
          : code;

        return (
          <pre
            key={index}
            className="bg-gray-800 text-gray-200 p-3 rounded-md my-2 overflow-x-auto"
          >
            <code>{codeContent}</code>
          </pre>
        );
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Editor de Scripts
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Endpoint:
            </label>
            <select
              value={selectedEndpoint || ""}
              onChange={handleEndpointSelect}
              className="w-full p-2 border border-gray-300 rounded-md text-black"
            >
              <option value="">-- Seleccionar endpoint --</option>
              {endpoints.map((endpoint: any) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.method} {endpoint.name}
                </option>
              ))}
            </select>
          </div>

          {selectedEndpoint !== null && (
            <>
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleScriptTypeChange("pre-request")}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      scriptType === "pre-request"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Pre-request Script
                  </button>
                  <button
                    onClick={() => handleScriptTypeChange("test")}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      scriptType === "test"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Tests (Post-response)
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <textarea
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm text-black"
                  rows={10}
                  placeholder={`// ${
                    scriptType === "pre-request"
                      ? "Script de Pre-request"
                      : "Script de Tests (Post-response)"
                  }`}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveScript}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={!scriptContent.trim()}
                >
                  Guardar Script
                </button>
              </div>
            </>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 flex flex-col h-[400px] bg-white">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Asistente de IA
          </h3>

          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 text-blue-800"
                      : message.role === "system"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </div>
                  <div className="text-xs mt-1 text-gray-500 flex justify-between items-center">
                    <span>{formatTime(message.timestamp)}</span>

                    {message.role === "assistant" &&
                      message.content.includes("```") && (
                        <button
                          onClick={() => applyCodeFromChat(message.content)}
                          className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600"
                        >
                          Aplicar código
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 p-2 border border-gray-300 rounded-l-md text-black"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className={`px-4 py-2 ${
                isLoading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
              } text-white rounded-r-md`}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Enviar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
