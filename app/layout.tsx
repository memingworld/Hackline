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
      <body className="min-h-screen bg-[#14110e] text-[#fef3c7] antialiased selection:bg-[#e5a93c]/30 selection:text-[#fef3c7]">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1f1b16",
              border: "1px solid rgba(229, 169, 60, 0.25)",
              color: "#fef3c7",
            },
          }}
        />
      </body>
    </html>
  );
}
