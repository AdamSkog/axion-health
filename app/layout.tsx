import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationLoading } from "@/components/NavigationLoading";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Axion Health - Health Telemetry, Reimagined",
  description: "Unify your health data with AI-powered insights. Secure, intelligent, and personalized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <NavigationLoading />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
