"use client";

import {
  createElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type AllHTMLAttributes,
  type ReactNode,
} from "react";
import { swarm, type BuildKind } from "./engine";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type BuildProps = AllHTMLAttributes<HTMLElement> & {
  /** Element to render in place of a plain tag; markup stays identical. */
  as?: keyof JSX.IntrinsicElements;
  kind?: BuildKind;
  /** Status under the cursor (or the file name, for `kind="image"`). */
  label?: string;
  optional?: boolean;
  children?: ReactNode;
};

/**
 * Renders the element exactly as before, but hands it to the cursor swarm,
 * which builds it live on the home page. Everywhere else, and for visitors
 * who prefer reduced motion, it renders as a normal element.
 */
const Build = ({
  as = "div",
  kind = "block",
  label,
  optional,
  children,
  ...rest
}: BuildProps) => {
  const id = useId();
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    return swarm.register(id, ref.current, { kind, label, optional });
  }, [id, kind, label, optional]);

  return createElement(
    as,
    { ...rest, ref, "data-swarm": "pending", "data-swarm-id": id },
    children
  );
};

export default Build;
