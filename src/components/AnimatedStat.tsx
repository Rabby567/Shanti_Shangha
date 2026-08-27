import { useEffect, useRef, useState } from "react";
import type { Stat } from "../types";

interface AnimatedStatProps {
  /** Statistic configuration received from the site data. */
  stat: Stat;
}

/**
 * Converts Bengali numerals to English numerals.
 *
 * Example:
 * "১২৩" → "123"
 *
 * This is required because JavaScript's Number() does not
 * correctly parse Bengali numeric characters.
 */
function bengaliToEnglishDigits(value: string): string {
  const bengaliDigits = "০১২৩৪৫৬৭৮৯";
  const englishDigits = "0123456789";

  return value.replace(/[০-৯]/g, (digit) => {
    const index = bengaliDigits.indexOf(digit);

    return index >= 0 ? englishDigits[index] : digit;
  });
}

/**
 * Extracts a numeric value from a statistic string.
 *
 * Supported examples:
 *   "১০০+"  → 100
 *   "50+"   → 50
 *   "২০০"   → 200
 *   "২৪/৭"  → [24, 7]
 */
function extractNumber(value: string): number {
  const normalized = bengaliToEnglishDigits(value);

  const numericPart = normalized.replace(/[^0-9]/g, "");

  const number = Number(numericPart);

  return Number.isFinite(number) ? number : 0;
}

/**
 * Converts an English number back into Bengali numerals.
 *
 * Example:
 * 100 → "১০০"
 */
function englishToBengaliDigits(value: number): string {
  const englishDigits = "0123456789";
  const bengaliDigits = "০১২৩৪৫৬৭৮৯";

  return String(value).replace(/[0-9]/g, (digit) => {
    return bengaliDigits[englishDigits.indexOf(digit)];
  });
}

/**
 * Animated statistic card.
 *
 * The counter:
 * - Starts when the card enters the viewport.
 * - Animates smoothly from zero to the configured value.
 * - Supports Bengali and English numerals.
 * - Preserves "+" suffixes.
 * - Supports both "24/7" and "২৪/৭".
 */
export function AnimatedStat({ stat }: AnimatedStatProps) {
  const [progress, setProgress] = useState(0);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const element = cardRef.current;

    if (!element) {
      return;
    }

    /**
     * Observe when the statistic card becomes visible.
     */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasStartedRef.current) {
          return;
        }

        hasStartedRef.current = true;

        const startTime = performance.now();

        // Total animation duration in milliseconds.
        const duration = 1600;

        /**
         * Animate the counter using requestAnimationFrame.
         */
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;

          // Convert elapsed time into a 0 → 1 progress value.
          const rawProgress = Math.min(elapsed / duration, 1);

          /**
           * Ease-out cubic.
           *
           * This makes the animation start quickly and
           * slow down naturally near the final value.
           */
          const easedProgress =
            1 - Math.pow(1 - rawProgress, 3);

          setProgress(easedProgress);

          if (rawProgress < 1) {
            animationFrameRef.current =
              requestAnimationFrame(animate);
          } else {
            // Make absolutely sure the final state is exactly 100%.
            setProgress(1);
          }
        };

        animationFrameRef.current =
          requestAnimationFrame(animate);

        // We only need to trigger the animation once.
        observer.disconnect();
      },
      {
        // Start when approximately 30% of the card is visible.
        threshold: 0.3,
      },
    );

    observer.observe(element);

    /**
     * Cleanup:
     * - Disconnect IntersectionObserver.
     * - Cancel any running animation frame.
     */
    return () => {
      observer.disconnect();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * Special case: 24/7
   * ---------------------------------------------------------
   *
   * Supports both:
   *   24/7
   *   ২৪/৭
   */
  const normalizedValue = bengaliToEnglishDigits(stat.value);

  if (normalizedValue.includes("/")) {
    const parts = normalizedValue.split("/");

    const firstTarget = extractNumber(parts[0]);
    const secondTarget = extractNumber(parts[1]);

    const firstCurrent = Math.round(
      firstTarget * progress,
    );

    const secondCurrent = Math.round(
      secondTarget * progress,
    );

    return (
      <div ref={cardRef} className="stat-card">
        <strong>
          {englishToBengaliDigits(firstCurrent)}
          /
          {englishToBengaliDigits(secondCurrent)}
        </strong>

        <span>{stat.label}</span>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Normal numeric statistics
   * ---------------------------------------------------------
   *
   * Examples:
   *   ১০০+
   *   ৫০+
   *   ২০০+
   *   100+
   */
  const target = extractNumber(stat.value);

  const currentValue = Math.round(target * progress);

  /**
   * Preserve the "+" suffix from the original value.
   */
  const hasPlus = normalizedValue.includes("+");

  return (
    <div ref={cardRef} className="stat-card">
      <strong>
        {englishToBengaliDigits(currentValue)}
        {hasPlus ? "+" : ""}
      </strong>

      <span>{stat.label}</span>
    </div>
  );
}