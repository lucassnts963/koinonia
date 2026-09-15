import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Desligado: essas duas opções fazem o next-pwa buscar/cachear a
  // navegação (e os assets dela) de forma proativa a cada <Link> — mais
  // requisições concorrentes de rota disparadas pelo próprio navegador,
  // exatamente o padrão que faz duas tentativas de refresh de sessão do
  // Supabase competirem pelo mesmo refresh token e derrubarem a sessão
  // (ver lib/supabase/middleware.ts). O offline de verdade deste app é o
  // texto da Bíblia em IndexedDB (hooks/useOfflineBible.ts) — isto aqui
  // não ganha nada em troca do risco.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
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
