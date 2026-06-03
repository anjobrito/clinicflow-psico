import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SidebarProductLinks from "./SidebarProductLinks";
import "./globals.css";
import "./sidebarAccordion.css";

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
        <SidebarProductLinks />
        {children}
      </body>
    </html>
  );
}
