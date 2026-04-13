import { Shell } from "@/components/layout/Shell";
import "./globals.css";

export const metadata = {
  title: "Interview Intelligence",
  description: "Decision-support tools for HRs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
