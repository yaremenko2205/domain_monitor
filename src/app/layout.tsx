import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Globe } from "lucide-react";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavSettingsLink } from "@/components/nav-settings-link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Domain Monitor",
  description: "Monitor domain expiration dates and get notified",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthSessionProvider>
            <nav className="border-b bg-background">
              <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold text-lg"
                >
                  <Globe className="h-5 w-5" />
                  Domain Monitor
                </Link>
                <div className="ml-auto flex items-center gap-4">
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                  <NavSettingsLink />
                  <ThemeToggle />
                  <UserMenu />
                </div>
              </div>
            </nav>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
            <Toaster />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
