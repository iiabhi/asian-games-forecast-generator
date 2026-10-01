/** @type {import('next').NextConfig} */
const nextConfig = {
  // Make sure the committed data and the prompt are bundled into the serverless functions (fallback data + forecast prompt).
  outputFileTracingIncludes: { "/**": ["./data/**/*", "./prompts/**/*"] },
};
export default nextConfig;
