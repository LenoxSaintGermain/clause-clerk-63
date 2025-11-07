/**
 * Subtle casino-style scroll animation with overshoot effect
 */

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

interface ScrollAnimationOptions {
  duration: number;
  tickCount: number;
  overshoot: number;
  onTick?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Animate scroll to target position with subtle casino effect
 */
export const subtleScrollToBlock = (
  container: HTMLElement,
  targetPosition: number,
  isMobile: boolean = false
): Promise<void> => {
  return new Promise((resolve) => {
    const startPosition = container.scrollTop;
    const distance = targetPosition - startPosition;

    const options: ScrollAnimationOptions = {
      duration: isMobile ? 500 : 800,
      tickCount: isMobile ? 2 : 3,
      overshoot: isMobile ? 5 : 10,
      onComplete: () => resolve()
    };

    const { duration, tickCount, overshoot } = options;
    const startTime = performance.now();

    // Calculate tick positions
    const tickPositions: number[] = [];
    for (let i = 1; i <= tickCount; i++) {
      const progress = i / (tickCount + 1);
      tickPositions.push(startPosition + distance * progress);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Eased progress
      const easedProgress = easeOutCubic(progress);

      let scrollPosition: number;

      if (progress < 1) {
        // During animation
        scrollPosition = startPosition + distance * easedProgress;
      } else {
        // At end: overshoot then settle
        const overshootProgress = Math.min((elapsed - duration) / 150, 1);
        if (overshootProgress < 0.5) {
          // Overshoot
          scrollPosition = targetPosition + overshoot * (1 - overshootProgress * 2);
        } else {
          // Settle back
          scrollPosition = targetPosition + overshoot * (1 - overshootProgress) * 2;
        }
      }

      container.scrollTop = scrollPosition;

      if (elapsed < duration + 150) {
        requestAnimationFrame(animate);
      } else {
        // Final position
        container.scrollTop = targetPosition;
        options.onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  });
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Scroll to target with or without animation based on user preference
 */
export const scrollToBlockResponsive = async (
  container: HTMLElement,
  targetPosition: number,
  isMobile: boolean = false
): Promise<void> => {
  if (prefersReducedMotion()) {
    // No animation, instant scroll
    container.scrollTo({ top: targetPosition, behavior: 'auto' });
    return Promise.resolve();
  }

  return subtleScrollToBlock(container, targetPosition, isMobile);
};
