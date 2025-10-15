# OpenAPI Example Generator

Una aplicación monolítica con Next.js (App Router) que permite cargar un archivo openapi.json, listar los endpoints y generar ejemplos de request/response realistas usando Faker.

## Características

- Subir un archivo OpenAPI en formato JSON
- Visualizar todos los endpoints disponibles
- Filtrar endpoints por método HTTP y tags
- Generar ejemplos realistas de request y response usando Faker
- Copiar o descargar los ejemplos generados
- Modo oscuro
- Generación de colecciones de Postman con variables
- Editor de scripts de Postman con asistencia de IA

## Tecnologías

- Next.js 14+ con App Router
- TypeScript
- TailwindCSS
- @faker-js/faker - para generar datos falsos
- @apidevtools/swagger-parser - para leer y resolver $ref dentro del OpenAPI
- react-json-view-lite - para visualizar el JSON resultante
- OpenAI API - para la asistencia de IA en la generación de scripts

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea un archivo .env.local con el siguiente contenido:
# OPENAI_API_KEY=tu_api_key_aqui
# OPENAI_MODEL=gpt-3.5-turbo

# Iniciar servidor de desarrollo
npm run dev
```

## Configuración de OpenAI

Para utilizar la funcionalidad de asistencia de IA, necesitas configurar una API key de OpenAI:

1. Crea una cuenta en [OpenAI](https://platform.openai.com/) si aún no tienes una
2. Genera una API key en la sección de API Keys
3. Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:
   ```
   OPENAI_API_KEY=tu_api_key_aqui
   OPENAI_MODEL=gpt-3.5-turbo
   ```
4. Reinicia el servidor de desarrollo

Si no configuras una API key, la aplicación seguirá funcionando pero utilizará respuestas predefinidas en lugar de generar respuestas con IA.

## Uso

1. Accede a la aplicación en http://localhost:3000
2. Sube un archivo OpenAPI en formato JSON
3. Navega por la lista de endpoints disponibles
4. Selecciona un endpoint para ver ejemplos de request/response
5. Regenera ejemplos, copia al portapapeles o descarga como archivo JSON

### Generación de Colecciones Postman

1. Activa el modo de selección múltiple
2. Selecciona los endpoints que deseas incluir en la colección
3. Haz clic en "Mostrar Generador de Colección Postman"
4. Personaliza el nombre y la descripción de la colección
5. Haz clic en "Editar con Asistente IA" para agregar scripts
6. Utiliza el chat para solicitar ejemplos de scripts de pre-request y tests
7. Aplica los scripts a los endpoints seleccionados
8. Descarga la colección final

## Estructura del proyecto

```
app/
  collection-editor/
    page.tsx                    # Página de edición de colecciones
  page.tsx                      # Página principal
  components/
    CollectionChat.tsx          # Chat con asistencia de IA
    EndpointList.tsx            # Listar endpoints
    PostmanCollection.tsx       # Generador de colecciones
    SchemaExample.tsx           # Mostrar ejemplo con faker
    UploadOpenApi.tsx           # Subir el JSON
lib/
  aiService.ts                  # Servicio de integración con OpenAI
  fakerGenerator.ts             # Función para generar datos desde schema
  openapiParser.ts              # Función para parsear el openapi.json
```
