import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🌾 All tasks 2026 | PaDi Design',
  description: 'Lightweight Notion-like workspace hosted on Vercel with Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100">
        {children}
      </body>
    </html>
  );
}
