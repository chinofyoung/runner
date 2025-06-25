import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for Supabase WebSocket and realtime issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // Ignore specific problematic modules
      config.externals = config.externals || [];
      config.externals.push({
        ws: "ws",
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
        isows: "isows",
      });

      // Specifically ignore realtime-js and isows for client builds
      config.resolve.alias = {
        ...config.resolve.alias,
        "@supabase/realtime-js": false,
        isows: false,
      };
    }
    return config;
  },
};

export default nextConfig;
