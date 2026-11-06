"use client";

import {
  createElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type AllHTMLAttributes,
  type ElementType,
  type ReactNode,
} from "react";
import { swarm, type BuildKind } from "./engine";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type BuildProps = Omit<AllHTMLAttributes<HTMLElement>, "as"> & {
  /** Tag or component to render (e.g. "h1", Link); the markup is unchanged. */
  as?: ElementType;
  kind?: BuildKind;
  /** Status under the cursor (or the file name, for `kind="image"`). */
  caption?: string;
  optional?: boolean;
  priority?: boolean;
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
  caption,
  optional,
  priority,
  children,
  ...rest
}: BuildProps) => {
  const id = useId();
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    return swarm.register(id, ref.current, {
      kind,
      caption,
      optional,
      priority,
    });
  }, [id, kind, caption, optional, priority]);

  return createElement(
    as,
    { ...rest, ref, "data-swarm": "pending", "data-swarm-id": id },
    children
  );
};

export default Build;
