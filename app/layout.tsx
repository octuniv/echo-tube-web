import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { hasAdminRole, loginStatus } from "@/lib/authState";
import AppShell from "@/components/layout/AppShell";
import { FetchCategoriesWithBoards } from "@/lib/action/boardBrowseActions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recommended favorite content",
  description: "show contents collected from web and add bookmark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLogined = await loginStatus();
  const isAdmin = await hasAdminRole();
  const categoriesWithBoards = await FetchCategoriesWithBoards();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell
          isLogined={isLogined}
          isAdmin={isAdmin}
          categoriesWithBoards={categoriesWithBoards}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
