import type { Metadata } from 'next';
import { Heebo, Fraunces } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import { SavedProvider } from '@/context/SavedContext';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import MealPlanPanel from '@/components/ui/MealPlanPanel';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: 'Easy PREP Nutrition',
  description: 'מתכוני מילפרפ לשגרה בריאה | Meal prep recipes for a healthy routine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${fraunces.variable}`}>
      {/* Synchronous theme script — runs before CSS to prevent flash of wrong theme */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('easyprep_theme');
            var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen antialiased">
        <ClerkProvider>
          <ThemeProvider>
          <LanguageProvider>
            <MealPlanProvider>
              <SavedProvider>
                {/* Permanent sidebar */}
                <Sidebar />

                {/* Content offset by sidebar width on md+ */}
                <div
                  className="md:ps-[240px]"
                  style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
                >
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>

                <MealPlanPanel />
              </SavedProvider>
            </MealPlanProvider>
          </LanguageProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
