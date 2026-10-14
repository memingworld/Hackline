import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Hackline — Next-Gen Hackathon Management Platform",
  description: "Organize, track, and dominate hackathons with elite team workspaces and smart integrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa] antialiased selection:bg-indigo-500/20 selection:text-indigo-200">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
