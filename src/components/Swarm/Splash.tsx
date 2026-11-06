import { AGENTS, MOBILE_AGENTS } from "./agents";

/**
 * Shown for a moment on the home page before the cursors start, so visitors
 * know what they're about to watch. Hidden unless the build is going to run
 * (see the boot script in layout.tsx and `.swarm-splash` in globals.css).
 */
const Splash = () => {
  return (
    <div className="swarm-splash" aria-hidden>
      <div className="relative flex flex-col items-center gap-5 px-10 text-center">
        <div className="rainbow-shadow absolute left-1/2 top-1/2 h-64 w-64 rounded-full opacity-20 blur-3xl" />
        <div className="swarm-splash-in relative font-Anton text-5xl tracking-wide text-white max-sm:text-4xl">
          Ramit Vishwakarma
        </div>
        <p className="swarm-splash-in relative text-white/75 tracking-wide [animation-delay:120ms]">
          Watch my stack build this page.
        </p>
        <ul className="relative flex max-w-xl flex-wrap justify-center gap-x-4 gap-y-3 pt-2">
          {AGENTS.map((a, i) => (
            <li
              key={a.name}
              className={`swarm-splash-in flex items-start ${
                i >= MOBILE_AGENTS ? "max-five:hidden" : ""
              }`}
              style={{ animationDelay: `${250 + i * 30}ms` }}>
              <svg width="14" height="16" viewBox="0 0 22 24" fill="none">
                <path
                  d="M3 2.5v16.2l4.4-4.1 2.9 6.6 3.1-1.35-2.85-6.45 6.15-.2L3 2.5z"
                  fill={a.color}
                  stroke="#ffffff"
                  strokeOpacity="0.5"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="ml-0.5 mt-2.5 whitespace-nowrap rounded-full px-2 py-[3px] font-ProductSans text-[11px] font-bold leading-none ring-1 ring-white/20"
                style={{
                  background: a.color,
                  color: isLight(a.color) ? "#000000" : "#ffffff",
                }}>
                {a.name}
              </span>
            </li>
          ))}
        </ul>
        <p className="swarm-splash-in relative text-sm text-grey-300/80 [animation-delay:700ms]">
          Each cursor is a tool I use.
        </p>
      </div>
    </div>
  );
};

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) /
    255;
  return lum >= 0.5;
}

export default Splash;
