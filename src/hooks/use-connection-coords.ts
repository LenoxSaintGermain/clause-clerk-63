import { useState, useEffect, RefObject } from 'react';

export interface ConnectionCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
}

/**
 * Calculate coordinates for curved arrow connection between finding card and contract block
 */
export const useConnectionCoords = (
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  isActive: boolean
): ConnectionCoordinates | null => {
  const [coords, setCoords] = useState<ConnectionCoordinates | null>(null);

  useEffect(() => {
    if (!isActive || !sourceRef.current || !targetRef.current) {
      setCoords(null);
      return;
    }

    const calculateCoords = () => {
      const sourceRect = sourceRef.current!.getBoundingClientRect();
      const targetRect = targetRef.current!.getBoundingClientRect();

      // Start from right edge center of source
      const startX = sourceRect.right;
      const startY = sourceRect.top + sourceRect.height / 2;

      // End at left edge center of target
      const endX = targetRect.left;
      const endY = targetRect.top + targetRect.height / 2;

      // Control point for quadratic bezier curve
      const midX = (startX + endX) / 2;
      const controlX = midX;
      const controlY = (startY + endY) / 2 + 40; // Add 40px curve

      setCoords({
        startX,
        startY,
        endX,
        endY,
        controlX,
        controlY
      });
    };

    calculateCoords();

    // Recalculate on scroll or resize
    const handleUpdate = () => {
      if (isActive) {
        calculateCoords();
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [sourceRef, targetRef, isActive]);

  return coords;
};
