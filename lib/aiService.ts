import OpenAI from "openai";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Inicializar el cliente de OpenAI
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OpenAI API key not found. Using fallback responses.");
    return null;
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

// Ejemplos de scripts de Postman para diferentes casos de uso (fallback)
const scriptExamples = {
  "pre-request": {
    auth: `// Script para manejar autenticación
pm.sendRequest({
    url: pm.variables.get("authUrl"),
    method: 'POST',
    header: {
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            username: pm.variables.get("username"),
            password: pm.variables.get("password")
        })
    }
}, function (err, res) {
    if (err) {
        console.error(err);
    } else {
        var responseJson = res.json();
        pm.variables.set("authToken", responseJson.token);
    }
});`,

    timestamp: `// Agregar timestamp a la solicitud
var moment = require('moment');
pm.variables.set("timestamp", moment().format());`,

    randomData: `// Generar datos aleatorios para la solicitud
var uuid = require('uuid');
pm.variables.set("requestId", uuid.v4());

// Generar un número aleatorio entre min y max
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

pm.variables.set("randomAmount", getRandomNumber(100, 1000));`,
  },

  test: {
    basic: `// Validaciones básicas
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});`,

    schema: `// Validar schema de respuesta
var schema = {
    "type": "object",
    "required": ["id", "name", "status"],
    "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "status": { "type": "string", "enum": ["active", "inactive"] }
    }
};

pm.test("Response matches schema", function () {
    var jsonData = pm.response.json();
    pm.expect(tv4.validate(jsonData, schema)).to.be.true;
});`,

    extractData: `// Extraer datos de la respuesta y guardarlos en variables
var jsonData = pm.response.json();

if (jsonData.id) {
    pm.variables.set("entityId", jsonData.id);
    console.log("Saved entity ID: " + jsonData.id);
}

// Extraer datos para usar en la siguiente solicitud
if (jsonData.nextPageToken) {
    pm.variables.set("nextPageToken", jsonData.nextPageToken);
}`,

    errorHandling: `// Manejo de errores
pm.test("Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

if (pm.response.code >= 400) {
    pm.test("Error response has message", function () {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property("message");
        console.error("Error: " + jsonData.message);
    });
}`,
  },
};

// Función para generar un resumen de la colección para el contexto
function generateCollectionSummary(collection: any): string {
  if (!collection) return "";

  try {
    // Información básica de la colección
    let summary = `Colección Postman: "${collection.info?.name || "Sin nombre"}"
Descripción: ${collection.info?.description || "Sin descripción"}
`;

    // Resumen de los endpoints
    if (collection.item && Array.isArray(collection.item)) {
      summary += `\nEndpoints (${collection.item.length}):\n`;

      collection.item.forEach((item: any, index: number) => {
        const method = item.request?.method || "UNKNOWN";
        const url =
          item.request?.url?.raw || item.name || `Endpoint ${index + 1}`;
        const hasPreRequest = item.event?.some(
          (e: any) => e.listen === "prerequest"
        );
        const hasTests = item.event?.some((e: any) => e.listen === "test");

        summary += `- ${method} ${url}${
          hasPreRequest ? " [Pre-request: Sí]" : ""
        }${hasTests ? " [Tests: Sí]" : ""}\n`;
      });
    }

    // Variables de la colección
    if (
      collection.variable &&
      Array.isArray(collection.variable) &&
      collection.variable.length > 0
    ) {
      summary += `\nVariables (${collection.variable.length}):\n`;
      collection.variable.forEach((variable: any) => {
        summary += `- ${variable.key}: ${variable.value || "(sin valor)"}\n`;
      });
    }

    return summary;
  } catch (error) {
    console.error("Error generating collection summary:", error);
    return "Error al generar resumen de la colección.";
  }
}

// Función para generar una respuesta usando OpenAI
export async function generateAIResponse(
  messages: Message[],
  collection?: any
): Promise<{
  choices: Array<{ message: Message; finish_reason: string; index: number }>;
}> {
  const openai = getOpenAIClient();

  // Preparar los mensajes con el contexto de la colección si está disponible
  let contextualizedMessages = [...messages];

  if (collection) {
    // Generar un resumen de la colección
    const collectionSummary = generateCollectionSummary(collection);

    // Insertar el resumen como un mensaje de sistema al principio de la conversación
    contextualizedMessages = [
      {
        role: "system",
        content: `Eres un asistente especializado en ayudar a crear y modificar scripts de Postman para colecciones de API. 
Utilizarás la siguiente información sobre la colección actual para proporcionar respuestas más precisas:

${collectionSummary}

Cuando el usuario solicite ayuda con scripts de pre-request o tests, proporciona ejemplos relevantes y específicos para los endpoints de esta colección.`,
      },
      ...messages,
    ];
  }

  if (openai) {
    try {
      // Usar la API de OpenAI
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: contextualizedMessages as any,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        choices: [
          {
            message: {
              role: "assistant",
              content:
                response.choices[0]?.message?.content ||
                "No se pudo generar una respuesta.",
            },
            finish_reason: response.choices[0]?.finish_reason || "stop",
            index: 0,
          },
        ],
      };
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      // Fallback al modo simulado
      return generateFallbackResponse(messages);
    }
  } else {
    // Si no hay API key, usar el modo simulado
    return generateFallbackResponse(messages);
  }
}

// Función para generar respuestas simuladas (fallback)
function generateFallbackResponse(messages: Message[]) {
  // Obtener el último mensaje del usuario
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("El último mensaje debe ser del usuario");
  }

  const userMessage = lastMessage.content.toLowerCase();
  let responseContent = "";

  // Generar respuesta basada en palabras clave
  if (
    userMessage.includes("pre-request") &&
    userMessage.includes("autenticación")
  ) {
    responseContent = `Aquí tienes un script de pre-request para manejar autenticación:

\`\`\`javascript
${scriptExamples["pre-request"].auth}
\`\`\`

Este script envía una solicitud para obtener un token de autenticación y lo guarda en una variable de Postman.`;
  } else if (
    userMessage.includes("pre-request") &&
    userMessage.includes("timestamp")
  ) {
    responseContent = `Aquí tienes un script de pre-request para agregar un timestamp:

\`\`\`javascript
${scriptExamples["pre-request"].timestamp}
\`\`\`

Este script utiliza la biblioteca moment.js para generar un timestamp y guardarlo en una variable.`;
  } else if (
    userMessage.includes("pre-request") &&
    (userMessage.includes("aleatorio") || userMessage.includes("random"))
  ) {
    responseContent = `Aquí tienes un script de pre-request para generar datos aleatorios:

\`\`\`javascript
${scriptExamples["pre-request"].randomData}
\`\`\`

Este script genera un UUID aleatorio y un número aleatorio entre dos valores.`;
  } else if (userMessage.includes("test") && userMessage.includes("básico")) {
    responseContent = `Aquí tienes un script de test básico:

\`\`\`javascript
${scriptExamples["test"].basic}
\`\`\`

Este script verifica que el código de estado sea 200 y que el tiempo de respuesta sea menor a 500ms.`;
  } else if (userMessage.includes("test") && userMessage.includes("schema")) {
    responseContent = `Aquí tienes un script para validar el schema de la respuesta:

\`\`\`javascript
${scriptExamples["test"].schema}
\`\`\`

Este script utiliza tv4 para validar que la respuesta cumpla con un schema específico.`;
  } else if (
    userMessage.includes("test") &&
    (userMessage.includes("extraer") || userMessage.includes("extract"))
  ) {
    responseContent = `Aquí tienes un script para extraer datos de la respuesta:

\`\`\`javascript
${scriptExamples["test"].extractData}
\`\`\`

Este script extrae valores de la respuesta y los guarda en variables para usar en otras solicitudes.`;
  } else if (userMessage.includes("test") && userMessage.includes("error")) {
    responseContent = `Aquí tienes un script para manejar errores en la respuesta:

\`\`\`javascript
${scriptExamples["test"].errorHandling}
\`\`\`

Este script verifica si la respuesta es exitosa y, en caso de error, extrae el mensaje de error.`;
  } else if (userMessage.includes("pre-request")) {
    responseContent = `Los scripts de pre-request se ejecutan antes de que se envíe la solicitud. Puedes usarlos para:

1. Configurar variables de entorno
2. Generar datos dinámicos (timestamps, IDs aleatorios)
3. Realizar solicitudes de autenticación
4. Manipular datos antes de enviarlos

¿Qué tipo específico de script de pre-request necesitas?`;
  } else if (
    userMessage.includes("test") ||
    userMessage.includes("post-response")
  ) {
    responseContent = `Los scripts de test (post-response) se ejecutan después de recibir la respuesta. Puedes usarlos para:

1. Validar el código de estado y el tiempo de respuesta
2. Verificar que la respuesta cumpla con un schema específico
3. Extraer datos de la respuesta para usar en otras solicitudes
4. Manejar errores y realizar aserciones

¿Qué tipo específico de script de test necesitas?`;
  } else if (
    userMessage.includes("validación") ||
    userMessage.includes("validar")
  ) {
    responseContent = `Para validar respuestas en Postman, puedes usar:

\`\`\`javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has expected fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('name');
});

pm.test("Values are correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.active).to.be.true;
    pm.expect(jsonData.count).to.be.above(0);
});
\`\`\`

¿Necesitas algún tipo específico de validación?`;
  } else if (
    userMessage.includes("variable") ||
    userMessage.includes("environment")
  ) {
    responseContent = `Para trabajar con variables en Postman:

\`\`\`javascript
// Establecer una variable
pm.variables.set("variable_name", "variable_value");

// Obtener una variable
var value = pm.variables.get("variable_name");

// Variables de entorno
pm.environment.set("env_var", "value");
var envValue = pm.environment.get("env_var");

// Variables globales
pm.globals.set("global_var", "value");
var globalValue = pm.globals.get("global_var");
\`\`\`

¿Necesitas algún ejemplo específico para el uso de variables?`;
  } else {
    responseContent = `Puedo ayudarte con scripts de Postman para pre-request y tests. Algunos ejemplos de lo que puedo hacer:

1. Scripts de pre-request para:
   - Autenticación
   - Generación de datos dinámicos
   - Manipulación de variables

2. Scripts de test para:
   - Validación de respuestas
   - Verificación de schema
   - Extracción de datos
   - Manejo de errores

¿En qué puedo ayudarte específicamente?`;
  }

  // Simular una respuesta de la API
  return {
    choices: [
      {
        message: {
          role: "assistant" as const,
          content: responseContent,
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
  };
}

// Función para integrar con el componente de chat
export async function getChatCompletion(
  messages: Message[],
  collection?: any
): Promise<string> {
  try {
    const response = await generateAIResponse(messages, collection);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Lo siento, ocurrió un error al generar la respuesta.";
  }
}
