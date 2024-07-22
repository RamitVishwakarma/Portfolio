import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ramit Vishwakarma",
  description: "Rami Vishwakarma's portfolio website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-5xl  backdrop-blur-xl m-auto ">
          <div className="w-full py-4 text-white text-md content-center flex justify-between">
            <div className="sethoverfordot w-fit cursor-pointer leading-5 hover:text-green font-ProductSans font-bold">
              {/* <div>Ramit</div>
              <div className="relative">
                Vishwakarma
                <span className="w-1 h-1 rounded-full bg-green absolute ml-[1px] bottom-[5px]"></span>
              </div> */}
              <div className="font-ProductSans text-xl ">RV</div>
            </div>
            <ul className="flex gap-6 font-bold">
              <li className="hover:text-green cursor-pointer">About</li>
              <li className="hover:text-green cursor-pointer">Experience</li>
              <li className="hover:text-green cursor-pointer">Projects</li>
              <li className="hover:text-green cursor-pointer">Resume</li>
            </ul>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
