// next.config.ts - VERSÃO CORRIGIDA
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oithqkjlvdgwlaumcibf.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "http2.mlstatic.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  trailingSlash: false,
  env: {
    NEXT_PUBLIC_MERCADO_LIVRE_APP_ID: process.env.MERCADO_LIVRE_APP_ID,
    NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI: process.env.MERCADO_LIVRE_REDIRECT_URI,
    NFE_AUTO_ENABLED: process.env.NFE_AUTO_ENABLED,
    NFE_AUTO_INTERVAL_MINUTES: process.env.NFE_AUTO_INTERVAL_MINUTES,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXT_PUBLIC_NFE_AMBIENTE: process.env.NFE_AMBIENTE || "homologacao",
  },
  outputFileTracingRoot: path.join(__dirname, "./"),
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        https: "https",
        crypto: "crypto",
        fs: "fs",
        http: "http",
        stream: "stream",
        buffer: "buffer",
        "node-forge": "node-forge",
        "fast-xml-parser": "fast-xml-parser",
      });
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      // CORREÇÃO: headers de cache como itens SEPARADOS no array
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/:all*(svg|jpg|png|webp|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;