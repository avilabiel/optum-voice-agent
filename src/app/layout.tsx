import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Optum Voice Agent",
  description: "AI-driven member outreach for Optum nurse questionnaires.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
