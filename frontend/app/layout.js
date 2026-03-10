import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'LegalEase — AI-Powered Indian Legal Assistant',
  description: 'Ask legal questions and get AI-generated answers grounded in real Indian law — IPC, CrPC, Constitution, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0f] text-white font-sans antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
