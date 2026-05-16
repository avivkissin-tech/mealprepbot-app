import type { Metadata } from 'next';
import { Heebo, Fraunces } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { LanguageProvider } from '@/context/LanguageContext';
import { MealPlanProvider } from '@/context/MealPlanContext';
import Header from '@/components/layout/Header';
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
      <body className="min-h-screen flex flex-col antialiased">
        <ClerkProvider>
        <LanguageProvider>
          <MealPlanProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <MealPlanPanel />
          </MealPlanProvider>
        </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
