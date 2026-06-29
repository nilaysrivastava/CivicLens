import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useSmoothScroll } from '@/lib/animations/useSmoothScroll';
import { MantineProvider } from '@mantine/core';

export function MainLayout({ children }: { children: ReactNode }) {
  useSmoothScroll();

  return (
    <MantineProvider>
      <div className="min-h-screen flex flex-col bg-civic-bg bg-civic-grid overflow-hidden relative">
        {/* Premium Background Hue System */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-civic-primary opacity-[0.03] rounded-full blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute bottom-[50px] left-[-50px] w-[350px] h-[350px] bg-civic-yellow opacity-[0.05] rounded-full blur-[80px] z-0 pointer-events-none"></div>
        <div className="absolute top-[300px] left-[400px] w-[300px] h-[300px] bg-civic-red opacity-[0.02] rounded-full blur-[100px] z-0 pointer-events-none"></div>

        <Navbar />
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
        <Footer />
      </div>
    </MantineProvider>
  );
}
