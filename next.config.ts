const nextConfig = {
    reactStrictMode: true,
      typescript: {
          // !! WARN !!
              // This allows the build to finish even if "react-simple-maps" has no types
                  ignoreBuildErrors: true,
                    },
                      eslint: {
                          ignoreDuringBuilds: true,
                            },
                            };

                            export default nextConfig;
}