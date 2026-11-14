import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
