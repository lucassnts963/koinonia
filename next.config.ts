import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // `swcMinify` foi removido: não existe em PluginOptions. Sob `require()`
  // o objeto não era tipado, então a opção era ignorada em silêncio desde
  // sempre — o import tipado é que a denunciou.
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Empacota o servidor + apenas as dependências usadas em .next/standalone,
  // para a imagem Docker não carregar node_modules inteiro.
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  }
};

export default withPWA(nextConfig);
