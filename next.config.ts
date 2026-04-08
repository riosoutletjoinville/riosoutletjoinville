// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oithqkjlvdgwlaumcibf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'http2.mlstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  trailingSlash: false,
  // Substituindo serverRuntimeConfig e publicRuntimeConfig por env
  env: {
    NEXT_PUBLIC_MERCADO_LIVRE_APP_ID: process.env.MERCADO_LIVRE_APP_ID,
    NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI: process.env.MERCADO_LIVRE_REDIRECT_URI,
    // Variáveis que estavam no serverRuntimeConfig
    NFE_AUTO_ENABLED: process.env.NFE_AUTO_ENABLED,
    NFE_AUTO_INTERVAL_MINUTES: process.env.NFE_AUTO_INTERVAL_MINUTES,
    CRON_SECRET: process.env.CRON_SECRET,
    // Variável que estava no publicRuntimeConfig
    NEXT_PUBLIC_NFE_AMBIENTE: process.env.NFE_AMBIENTE || 'homologacao',
  },
  // Remove o aviso do workspace root
  outputFileTracingRoot: path.join(__dirname, './'),
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'https': 'https',
        'crypto': 'crypto',
        'fs': 'fs',
        'http': 'http',
        'stream': 'stream',
        'buffer': 'buffer',
        'node-forge': 'node-forge',
        'fast-xml-parser': 'fast-xml-parser'
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
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // REMOVIDO: swcMinify: true (não é mais necessário)
};

export default nextConfig;