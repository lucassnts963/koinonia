import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AplicarPreferencias from "@/components/tenda/AplicarPreferencias";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Koinonia',
    default: 'Koinonia - Discipulado & Estudo Bíblico',
  },
  description: "Plataforma de aprofundamento bíblico, jornada de leitura gamificada e gestão de discipulado.",
  // `/icon.png` nunca existiu — a referência era um placeholder ("assumindo
  // que existe") que nunca virou realidade, então o navegador caía no
  // favicon padrão do scaffold (o ícone genérico da Vercel). app/icon.svg e
  // app/favicon.ico agora existem de verdade — o App Router já detecta
  // app/icon.svg pela convenção de arquivo, sem precisar declarar aqui.
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Koinonia',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AplicarPreferencias />
        {children}
      </body>
    </html>
  );
}
