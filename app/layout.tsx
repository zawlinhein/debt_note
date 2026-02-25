import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DebtNote",
  description: "Track shared purchases",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 text-gray-900 antialiased`}>
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
            <main className="flex-1 px-4 pt-6">{children}</main>
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
