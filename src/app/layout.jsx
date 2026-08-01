import "./globals.css";
export const metadata = {
  title: "@xTranscendence",
  description: "Frontend and Canvas API",
};

export default async function RootLayout({ children }) {
  return (
    //suppressHydrationWarning for fix hydratation error in iOS chrome
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
