import { AGENTS, MOBILE_AGENTS } from "./agents";

const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const lum =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) /
    255;
  return lum >= 0.5;
};

/**
 * Shown for a moment on the home page before the cursors start, so visitors
 * know what they're about to watch. Each pill is drawn exactly like its
 * cursor: when the splash lifts, the cursors take over from these spots and
 * fly onto the page. Hidden unless the build is going to run (see the boot
 * script in layout.tsx and `.swarm-splash` in globals.css).
 */
const Splash = () => {
  return (
    <div className="swarm-splash" aria-hidden>
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="rainbow-shadow absolute left-1/2 top-1/2 h-[400px] w-[400px] rounded-full opacity-[0.45] blur-3xl" />
        {/* The words fade on a wrapper; the entrance animation on the inner
            element would otherwise hold its opacity at 1. */}
        <div className="swarm-splash-text relative">
          <div className="swarm-splash-in font-Anton text-5xl tracking-wide text-white max-sm:text-4xl">
            Ramit Vishwakarma
          </div>
        </div>
        <div className="swarm-splash-text relative">
          <p
            className="swarm-splash-in tracking-wide text-white/75"
            style={{ animationDelay: "100ms" }}>
            Watch my stack build this page.
          </p>
        </div>
        <ul className="relative flex max-w-2xl flex-wrap justify-center gap-x-3 gap-y-1">
          {AGENTS.map((a, i) => {
            const light = isLight(a.color);
            return (
              <li
                key={a.name}
                className={`swarm-splash-in flex items-start ${
                  i >= MOBILE_AGENTS ? "max-five:hidden" : ""
                }`}
                style={{ animationDelay: `${150 + i * 20}ms` }}>
                <svg
                  className="swarm-arrow shrink-0"
                  width="22"
                  height="24"
                  viewBox="0 0 22 24"
                  fill="none">
                  <path
                    d="M3 2.5v16.2l4.4-4.1 2.9 6.6 3.1-1.35-2.85-6.45 6.15-.2L3 2.5z"
                    fill={a.color}
                    stroke={light ? "#0b0b0b" : "#ffffff"}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={`-ml-1.5 mt-5 whitespace-nowrap rounded-full px-2 py-[3px] font-ProductSans text-[11px] font-bold leading-none shadow-lg ring-1 ${
                    light ? "text-black ring-black/60" : "text-white ring-white/40"
                  }`}
                  style={{ background: a.color }}>
                  {a.name}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="swarm-splash-text relative">
          <p
            className="swarm-splash-in text-sm text-grey-300/80"
            style={{ animationDelay: "450ms" }}>
            Each cursor is a tool I use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
