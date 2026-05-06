import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Manga Studio Workspace',
  description: 'AI-assisted manga authorship tool',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-[#191919] text-gray-100" suppressHydrationWarning>{children}</body>
    </html>
  );
}
