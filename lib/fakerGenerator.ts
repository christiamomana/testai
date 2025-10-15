import { faker } from "@faker-js/faker";
import { SchemaObject } from "./openapiParser";

export function generateFakeData(schema: SchemaObject): any {
  if (!schema) return undefined;

  // Handle $ref (should be already dereferenced by swagger-parser)
  if (schema.$ref) {
    console.warn("Found unresolved $ref:", schema.$ref);
    return { $ref: schema.$ref };
  }

  // Handle allOf, oneOf, anyOf
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const result = {};
    schema.allOf.forEach((subSchema) => {
      Object.assign(result, generateFakeData(subSchema));
    });
    return result;
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    // Pick one schema randomly
    const randomIndex = Math.floor(Math.random() * schema.oneOf.length);
    return generateFakeData(schema.oneOf[randomIndex]);
  }

  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    // Pick one schema randomly
    const randomIndex = Math.floor(Math.random() * schema.anyOf.length);
    return generateFakeData(schema.anyOf[randomIndex]);
  }

  // Handle different types
  switch (schema.type) {
    case "object":
      return generateObject(schema);
    case "array":
      return generateArray(schema);
    case "string":
      return generateString(schema);
    case "number":
    case "integer":
      return generateNumber(schema);
    case "boolean":
      return generateBoolean();
    case "null":
      return null;
    default:
      // If type is not specified but properties exist, treat as object
      if (schema.properties) {
        return generateObject(schema);
      }
      // Default fallback
      return schema.example || schema.default || null;
  }
}

function generateObject(schema: SchemaObject): Record<string, any> {
  const result: Record<string, any> = {};

  if (!schema.properties) {
    return result;
  }

  Object.entries(schema.properties).forEach(
    ([propertyName, propertySchema]) => {
      // Check if property is required
      const isRequired = schema.required?.includes(propertyName) || false;

      // Skip non-required properties randomly (30% chance)
      if (!isRequired && Math.random() > 0.7) {
        return;
      }

      result[propertyName] = generateFakeData(propertySchema as SchemaObject);
    }
  );

  return result;
}

function generateArray(schema: SchemaObject): any[] {
  if (!schema.items) {
    return [];
  }

  // Generate 1-5 items
  const count = Math.floor(Math.random() * 4) + 1;
  const result = [];

  for (let i = 0; i < count; i++) {
    result.push(generateFakeData(schema.items as SchemaObject));
  }

  return result;
}

function generateString(schema: SchemaObject): string {
  // Handle specific string formats
  if (schema.format) {
    switch (schema.format) {
      case "email":
        return faker.internet.email();
      case "uri":
      case "url":
        return faker.internet.url();
      case "uuid":
        return faker.string.uuid();
      case "date":
        return faker.date.anytime().toISOString().split("T")[0];
      case "date-time":
        return faker.date.anytime().toISOString();
      case "password":
        return faker.internet.password();
      case "byte":
        return btoa("fake-byte-string");
      case "binary":
        return "fake-binary-data";
      case "hostname":
        return faker.internet.domainName();
      case "ipv4":
        return faker.internet.ipv4();
      case "ipv6":
        return faker.internet.ipv6();
    }
  }

  // Handle enums
  if (schema.enum && schema.enum.length > 0) {
    const randomIndex = Math.floor(Math.random() * schema.enum.length);
    return schema.enum[randomIndex];
  }

  // Handle patterns
  if (schema.pattern) {
    try {
      // Basic pattern handling - not comprehensive
      if (schema.pattern.includes("\\d")) {
        return faker.string.numeric(10);
      }
      // For complex patterns, return a placeholder
      return `pattern:${schema.pattern}`;
    } catch (error) {
      console.warn("Error generating string for pattern:", schema.pattern);
    }
  }

  // Handle length constraints
  const minLength = schema.minLength || 5;
  const maxLength = schema.maxLength || 20;

  // Generate random string based on property name or description hints
  if (schema.description?.toLowerCase().includes("name")) {
    return faker.person.fullName();
  } else if (schema.description?.toLowerCase().includes("address")) {
    return faker.location.streetAddress();
  } else if (schema.description?.toLowerCase().includes("phone")) {
    return faker.phone.number();
  } else {
    return faker.lorem.words({ min: 1, max: 5 });
  }
}

function generateNumber(schema: SchemaObject): number {
  const isInteger = schema.type === "integer";
  const min = schema.minimum !== undefined ? schema.minimum : 0;
  const max = schema.maximum !== undefined ? schema.maximum : 1000;

  if (isInteger) {
    return faker.number.int({ min, max });
  } else {
    return faker.number.float({ min, max, precision: 0.01 });
  }
}

function generateBoolean(): boolean {
  return faker.datatype.boolean();
}

export function regenerateExample(schema: SchemaObject): any {
  return generateFakeData(schema);
}
