import "./globals.css";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });

export const metadata = {
  title: "InternShield - Scam-proof your career",
  description: "Paste an internship or job offer. InternShield flags suspicious signals, explains the risks and shows how to verify the employer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
