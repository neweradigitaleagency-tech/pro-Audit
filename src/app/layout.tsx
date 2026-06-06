import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProAudit — Prosuma",
  description: "Application d'audit superviseur pour le groupe Prosuma",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
