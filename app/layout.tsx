import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./productNav.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicFlow Psico",
  description:
    "Sistema web responsivo para psicólogos administrarem pacientes, agenda, atendimentos, evoluções e relatórios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <details className="app-actions-menu">
          <summary>Menu</summary>
          <nav aria-label="Ações principais">
            <a href="/">Painel</a>
            <a href="/relatorios">Relatórios</a>
            <a href="/financeiro">Financeiro</a>
          </nav>
        </details>
        {children}
      </body>
    </html>
  );
}
