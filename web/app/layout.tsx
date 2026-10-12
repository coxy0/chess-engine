import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "chess-engine",
  description: "A chess engine",
  // Empty icon so browsers don't request /favicon.ico (404) until we add one.
  icons: { icon: "data:," },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
