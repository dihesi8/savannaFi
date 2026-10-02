import './globals.css';
import Background from '@/components/Background';
import SmoothScroll from '@/components/SmoothScroll';
import LiveProvider from '@/components/LiveProvider';

export const metadata = {
  title: 'SavannaFi | Algorithmic gold on Robinhood Chain',
  description: 'SavannaFi is an algorithmic liquidity protocol built around SVN, MSHARE and MBOND, with gold (XAU) as the reference target.',
};

export const viewport = { themeColor: '#050605' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600;6..96,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Background />
        <SmoothScroll />
        <LiveProvider>{children}</LiveProvider>
      </body>
    </html>
  );
}
