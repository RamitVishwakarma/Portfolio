import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SwarmOverlay, { SwarmSkipLink } from "@/components/Swarm/SwarmOverlay";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Portfolio website | Ramit Vishwakarma",
  description: "Ramit Vishwakarma's portfolio website",
};

// Runs before first paint. On the home page it turns everything wrapped in
// <Build> into a faint ghost that the cursor swarm then builds live. The build
// plays once per browser; later visits (and back/forward) get the finished
// page with a "↻ Replay" button. Skipped for reduced motion and crawlers; ?swarm=0
// turns it off and ?swarm=1 forces it on. If the app hasn't booted within 3 s
// the page is shown as normal.
const swarmBoot = `(function(){try{
var d=document.documentElement,q=new URLSearchParams(location.search).get("swarm");
if(q==="0"||location.pathname!=="/")return;
var bot=/bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)||navigator.webdriver;
var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(q!=="1"&&(bot||calm))return;
var seen=false;try{seen=localStorage.getItem("swarm-seen")==="1"}catch(e){}
var nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
if(nav&&nav.type==="back_forward")seen=true;
if(q!=="1"&&seen){d.setAttribute("data-swarm-seen","1");return}
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
        <Navbar />
        {children}
        <SwarmOverlay />
        <SpeedInsights />
      </body>
    </html>
  );
}
