"use client";

import {
  createElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type AllHTMLAttributes,
  type ForwardRefExoticComponent,
  type ReactNode,
} from "react";
import { swarm, type BuildKind } from "./engine";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type BuildProps = Omit<AllHTMLAttributes<HTMLElement>, "as"> & {
  /**
   * Tag, or a ref-forwarding component such as next/link, to render in place
   * of the original element; the markup is unchanged.
   */
  as?: keyof JSX.IntrinsicElements | ForwardRefExoticComponent<any>;
  kind?: BuildKind;
  /** Status under the cursor (or the file name, for `kind="image"`). */
  caption?: string;
  optional?: boolean;
  priority?: boolean;
  /** Name of the cursor that should build this when it's free. */
  owner?: string;
  /** Sits on a light background (cursor labels switch to suit it). */
  surface?: "light";
  /** On phones, appears together with the element it sits in. */
  pack?: boolean;
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
  owner,
  surface,
  pack,
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
      owner,
      pack,
    });
  }, [id, as, kind, caption, optional, priority, owner, pack]);

  return createElement(
    as,
    {
      ...rest,
      ref,
      "data-swarm": "pending",
      "data-swarm-id": id,
      "data-swarm-kind": kind,
      "data-swarm-surface": surface,
    },
    children
  );
};

export default Build;
