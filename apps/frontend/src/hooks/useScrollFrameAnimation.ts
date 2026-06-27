import { useRef, useEffect } from 'react';

interface UseScrollFrameAnimationOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  frameCount: number;
  onFrame: (_index: number) => void;
  /** Called every tick with raw progress (0–1) through the scroll driver.
   *  Use this for continuous effects (zoom, parallax) — onFrame is quantized
   *  to integer frame steps and will skip repeats, this won't. */
  onProgress?: (_progress: number) => void;
}

/**
 * Walk the offsetParent chain to get the element's absolute top position
 * on the page. This is immune to sticky/fixed children and viewport changes.
 */
function getAbsoluteTop(el: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Maps window.scrollY to a frame index based on the section's absolute
 * position. No getBoundingClientRect during scroll — fully reliable.
 */
export function useScrollFrameAnimation({
  containerRef,
  frameCount,
  onFrame,
  onProgress,
}: UseScrollFrameAnimationOptions): void {
  // Keep refs to latest callbacks so the effect never needs to re-run for them
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduceMotion) {
      onFrameRef.current(0);
      onProgressRef.current?.(0);
      return;
    }

    let rafId: number | null = null;
    // Cache section geometry; recomputed on resize and via ResizeObserver
    // (catches layout shifts caused by image/loader changes without a
    // window resize event, e.g. the loader disappearing).
    let sectionTop = 0;
    let scrollable = 0;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      sectionTop = getAbsoluteTop(el);
      scrollable = el.offsetHeight - window.innerHeight;
    };

    const update = () => {
      rafId = null;
      if (scrollable <= 0) return;

      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - sectionTop) / scrollable),
      );
      const frameIndex = Math.min(
        Math.floor(progress * frameCount),
        frameCount - 1,
      );
      onFrameRef.current(frameIndex);
      onProgressRef.current?.(progress);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Layout can shift (loader fade-out, fonts loading, images affecting
    // container height) without firing a window resize event — re-measure
    // whenever the driver's own box changes size.
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        measure();
        onScroll();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef, frameCount]);
}