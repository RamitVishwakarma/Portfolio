import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SwarmOverlay, { SwarmSkipLink } from "@/components/Swarm/SwarmOverlay";
import Splash from "@/components/Swarm/Splash";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Ramit Vishwakarma's portfolio website",
};

// Runs before first paint. On the home page it shows the splash and hides
// everything wrapped in <Build>, so the page starts blank and the cursor
// swarm brings each piece into existence. It plays on every load, so a refresh replays it. Skipped for
// reduced motion and crawlers; ?swarm=0 turns it off and ?swarm=1 forces it
// on. If the app hasn't booted within 3 s the page is shown as normal.
const swarmBoot = `(function(){try{
var d=document.documentElement,q=new URLSearchParams(location.search).get("swarm");
if(q==="0"||location.pathname!=="/")return;
var bot=/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)||navigator.webdriver;
var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(q!=="1"&&(bot||calm))return;
d.classList.add("swarm-on");
setTimeout(function(){if(!window.__swarmReady)d.classList.remove("swarm-on")},3000);
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: swarmBoot }} />
      </head>
      <body>
        <SwarmSkipLink />
        <Splash />
        <Navbar />
        {children}
        <SwarmOverlay />
        <SpeedInsights />
      </body>
    </html>
  );
}
