// Reused from Neotoma's paper-scene motion; entry gate aligned with 7dd82c1 (MIT).
import { useEffect, useRef, type RefObject } from "react";

type Play = (target: Element) => Animation[];
const MAX_ACTIVE_SCENES = 2;

/** Animate actual entries, sharing a bounded FIFO budget across all visible scenes. */
export function observeViewportMotion(targets: Element[], play: Play, root?: HTMLElement): () => void {
  if (!window.matchMedia || !window.IntersectionObserver || !Element.prototype.animate)
    return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const registered = new Set(targets);
  const inside = new Set<Element>();
  const visible = new Set<Element>();
  const pending = new Set<Element>();
  const running = new Map<Element, Animation[]>();
  let disposed = false;
  const cancel = (target: Element) => {
    running.get(target)?.forEach((animation) => animation.cancel());
    running.delete(target);
  };
  const drain = () => {
    if (disposed || reduced.matches || document.hidden) return;
    for (const target of pending) {
      if (running.size >= MAX_ACTIVE_SCENES) break;
      if (!registered.has(target) || target.isConnected === false) {
        pending.delete(target);
        continue;
      }
      if (!visible.has(target)) continue;
      pending.delete(target);
      const animations = play(target);
      if (animations.length === 0) continue;
      target.setAttribute("data-motion-entry-count", String(Number(target.getAttribute("data-motion-entry-count") || 0) + 1));
      target.setAttribute("data-motion-animation-count", String(animations.length));
      running.set(target, animations);
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (running.get(target) !== animations) return;
        animations.forEach((animation) => animation.cancel());
        running.delete(target);
        drain();
      });
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (!registered.has(target)) continue;
        if (!entry.isIntersecting) {
          inside.delete(target);
          visible.delete(target);
          pending.delete(target);
          cancel(target);
        } else if (entry.intersectionRatio < 0.35) {
          visible.delete(target);
        } else {
          visible.add(target);
          if (!inside.has(target)) {
            inside.add(target);
            if (!reduced.matches && !document.hidden) pending.add(target);
          }
        }
      }
      drain();
    },
    { threshold: [0, 0.35] }
  );
  registered.forEach((target) => observer.observe(target));
  // Markdown components can remount SVGs without changing the article content.
  // Reconcile the real subtree, removing stale registrations before enrolling replacements.
  const mutations = root && window.MutationObserver ? new window.MutationObserver(() => {
    const current = new Set(root.querySelectorAll<SVGSVGElement>("[data-paper-scene]"));
    for (const target of registered) {
      if (current.has(target as SVGSVGElement)) continue;
      observer.unobserve(target);
      registered.delete(target);
      inside.delete(target);
      visible.delete(target);
      pending.delete(target);
      cancel(target);
    }
    for (const target of current) {
      if (registered.has(target)) continue;
      registered.add(target);
      observer.observe(target);
    }
    drain();
  }) : null;
  mutations?.observe(root!, { childList: true, subtree: true });
  const suppress = () => {
    pending.clear();
    registered.forEach(cancel);
  };
  const motionChange = () => {
    if (reduced.matches) suppress();
  };
  const visibilityChange = () => {
    if (document.hidden) suppress();
    // Resume remains settled; only a new viewport entry may enqueue motion.
  };
  reduced.addEventListener("change", motionChange);
  document.addEventListener("visibilitychange", visibilityChange);
  return () => {
    disposed = true;
    observer.disconnect();
    mutations?.disconnect();
    suppress();
    reduced.removeEventListener("change", motionChange);
    document.removeEventListener("visibilitychange", visibilityChange);
  };
}

const timing = { duration: 650, easing: "cubic-bezier(.22,.7,.2,1)", fill: "both" } as const;
export function playLogo(target: Element): Animation[] {
  return [...target.querySelectorAll<SVGElement>("[data-brand-part]")].map((part) =>
    part.animate(
      [
        { transform: "translateY(-3px)", opacity: 0.15 },
        { transform: "translateY(0px)", opacity: 1 },
      ],
      { ...timing, duration: 550, delay: (2 - Number(part.dataset.brandPart)) * 90 }
    )
  );
}

const PAPER_SPRING_MS = 820;
const springCache = new Map<string, Keyframe[]>();

/** Sample the displacement of a damped spring, with a modest initial velocity toward rest. */
export function springFrames(x: number, y: number, rotation: number): Keyframe[] {
  const key = `${x}:${y}:${rotation}`;
  const cached = springCache.get(key);
  if (cached) return cached;
  const frequency = 12,
    damping = 0.8,
    duration = PAPER_SPRING_MS / 1000;
  const decay = damping * frequency;
  const angular = frequency * Math.sqrt(1 - damping * damping);
  const frames = Array.from({ length: 33 }, (_, index) => {
    const t = (index / 32) * duration;
    const remaining =
      index === 32
        ? 0
        : Math.exp(-decay * t) *
          (Math.cos(angular * t) + ((decay - 5) / angular) * Math.sin(angular * t));
    return {
      offset: index / 32,
      transform: `translate(${x * remaining}px, ${y * remaining}px) rotate(${rotation * remaining}deg)`,
    };
  });
  springCache.set(key, frames);
  return frames;
}

export function playPaperScene(target: Element): Animation[] {
  const objects = [...target.querySelectorAll<SVGElement>("[data-paper-object]")];
  const duration = PAPER_SPRING_MS;
  let settledAt = duration;
  const arrivals = objects.map((object) => {
    const delay = Number(object.dataset.enterDelay || 0);
    settledAt = Math.max(settledAt, delay + duration);
    return object.animate(
      springFrames(
        Number(object.dataset.enterX),
        Number(object.dataset.enterY),
        Number(object.dataset.enterRotation)
      ),
      { duration, delay, easing: "linear", fill: "both" }
    );
  });
  const connections = [
    ...target.querySelectorAll<SVGGeometryElement>("[data-paper-connection]"),
  ].map((path, index) =>
    path.animate(
      [
        { strokeDasharray: "1", strokeDashoffset: "1" },
        { strokeDasharray: "1", strokeDashoffset: "0" },
      ],
      { duration: 600, delay: settledAt + 40 + index * 70, easing: "ease-out", fill: "both" }
    )
  );
  return [...arrivals, ...connections];
}

export function observePaperArticle(root: HTMLElement): () => void {
  return observeViewportMotion([...root.querySelectorAll<SVGSVGElement>("[data-paper-scene]")], playPaperScene, root);
}

export function usePageVisualMotion(ref: RefObject<HTMLElement>, revision?: unknown) {
  const current = useRef<{ root: HTMLElement; stop: () => void } | null>(null);
  // Run after every commit to recover a replaced article ref as well as SVG-only remounts.
  // An unchanged root keeps its observer and playback state; it does not replay on rerender.
  useEffect(() => {
    if (current.current?.root === ref.current) return;
    current.current?.stop();
    current.current = ref.current ? { root: ref.current, stop: observePaperArticle(ref.current) } : null;
  });
  useEffect(() => () => {
    current.current?.stop();
    current.current = null;
  }, [ref, revision]);
}
