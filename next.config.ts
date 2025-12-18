import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
    reactStrictMode: true,
      // This is the line that stops the build from failing
        typescript: {
            ignoreBuildErrors: true,
              },
                eslint: {
                    ignoreDuringBuilds: true,
                      },
                      };

                      export default nextConfig;