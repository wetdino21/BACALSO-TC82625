import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "tripvaler",
//   description: "tripvaler connects travelers who want to share journeys, split costs, meet new people, and embark on adventures together through a simple, safe, and efficient platform.",
// };

export const metadata = {
  title: "Tripvaler",
  description: "Travel app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col font-sans">
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
