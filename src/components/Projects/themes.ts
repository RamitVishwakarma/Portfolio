import type { Theme } from "./data";

// The four card looks from the original Featured Projects section.
export const themes: Record<
  Theme,
  {
    background: string;
    overlay: string;
    title: string;
    tag: string;
    text: string;
    button: string;
    buttonIcon: string;
    play: string;
  }
> = {
  rose: {
    background: "/images/backgrounds/bgCreme.png",
    overlay: "bg-[#ea546c]/20",
    title: "text-[#753f41]",
    tag: "border-[#753f41] border-2 text-[#f6eaea] bg-[#63393a]",
    text: "text-[#8d484a]",
    button: "bg-[#753f40] hover:bg-[#8c494b] text-[#e3bebf]",
    buttonIcon: "#e3bebf",
    play: "bg-[#753f41]",
  },
  blue: {
    background: "/images/backgrounds/bgBlue.png",
    overlay: "bg-black/30",
    title: "text-[#daf3f3]",
    tag: "border-[#ceefff] bg-[#e9f8ff] border-2 text-[#000e25]",
    text: "text-white/70",
    button: "bg-[#004fab] hover:bg-[#0057db] text-[#acebff]",
    buttonIcon: "#acebff",
    play: "bg-[#004fab]",
  },
  stone: {
    background: "/images/backgrounds/bgCreme.png",
    overlay: "bg-black/10",
    title: "text-[#5b5751]",
    tag: "border-[#8f8b80] bg-[#837e73] text-[#f7f7f5] border-2",
    text: "text-[#5b5751]",
    button: "bg-[#837e73] hover:bg-[#8f8b80] text-[#f7f7f5]",
    buttonIcon: "#f7f7f5",
    play: "bg-[#837e73]",
  },
  teal: {
    background: "/images/backgrounds/bgGreen.png",
    overlay: "bg-[#438e96]/10",
    title: "text-[#b9e7e8]",
    tag: "border-[#b9e7e8] bg-[#daf3f3] text-[#284a51] border-2",
    text: "text-[#b9e7e8]",
    button: "bg-[#b9e7e8] hover:bg-[#daf3f3] text-[#284a51]",
    buttonIcon: "#284a51",
    play: "bg-[#284a51]",
  },
};
