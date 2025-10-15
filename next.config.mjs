/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Estas variables se pueden sobrescribir con un archivo .env.local
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  },
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
