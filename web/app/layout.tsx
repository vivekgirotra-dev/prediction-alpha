import './globals.css';

export const metadata = {
  title: 'Prediction Alpha',
  description: 'Prediction market arbitrage scanner'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
