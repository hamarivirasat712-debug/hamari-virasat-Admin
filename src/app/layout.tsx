import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virasat Admin Dashboard",
  description: "Admin panel to manage orders, enquiries, and submissions for Hamari Virasat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1A0C04] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
