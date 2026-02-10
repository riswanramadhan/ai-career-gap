import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career Gap Architect | AI-Powered Career Analysis",
  description: "Bridge the gap between your resume and dream job with AI-powered skill analysis.",
  metadataBase: new URL("https://ai-career-gap-frontend.vercel.app"),
  openGraph: {
    title: "Career Gap Architect | AI-Powered Career Analysis",
    description: "Analyze your resume vs job description and get a personalized learning roadmap.",
    type: "website",
    url: "https://ai-career-gap-frontend.vercel.app",
    images: [
      {
        url: "https://drive.google.com/uc?export=download&id=1hzGa5klyU16YwzwUTTCX1mgO3emj2ej0",
        width: 1200,
        height: 630,
        alt: "Career Gap Architect preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Gap Architect | AI-Powered Career Analysis by Riswan Ramadhan",
    description: "Analyze your resume vs job description and get a personalized learning roadmap.",
    images: ["https://drive.google.com/uc?export=download&id=1hzGa5klyU16YwzwUTTCX1mgO3emj2ej0"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
