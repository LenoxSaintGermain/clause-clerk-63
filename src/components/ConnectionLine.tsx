import { useEffect, useState } from 'react';
import { ConnectionCoordinates } from '@/hooks/use-connection-coords';

interface ConnectionLineProps {
  coords: ConnectionCoordinates | null;
  isVisible: boolean;
  isMobile?: boolean;
}

export const ConnectionLine = ({ coords, isVisible, isMobile = false }: ConnectionLineProps) => {
  const [pathLength, setPathLength] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isVisible && coords) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), isMobile ? 400 : 600);
      return () => clearTimeout(timer);
    }
  }, [isVisible, coords, isMobile]);

  if (!coords || !isVisible) {
    return null;
  }

  const { startX, startY, endX, endY, controlX, controlY } = coords;

  // Create quadratic bezier curve path
  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  // Arrow head points
  const arrowSize = 8;
  const angle = Math.atan2(endY - controlY, endX - controlX);
  const arrowX1 = endX - arrowSize * Math.cos(angle - Math.PI / 6);
  const arrowY1 = endY - arrowSize * Math.sin(angle - Math.PI / 6);
  const arrowX2 = endX - arrowSize * Math.cos(angle + Math.PI / 6);
  const arrowY2 = endY - arrowSize * Math.sin(angle + Math.PI / 6);

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <style>{`
          @keyframes drawPath {
            from {
              stroke-dashoffset: ${pathLength};
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </defs>

      {/* Curved line */}
      <path
        d={pathD}
        stroke="hsl(var(--accent))"
        strokeWidth={isMobile ? 1 : 2}
        fill="none"
        opacity={isMobile ? 0.5 : 0.8}
        strokeDasharray={shouldAnimate ? pathLength : 'none'}
        style={{
          animation: shouldAnimate
            ? `drawPath ${isMobile ? 400 : 600}ms ease-out forwards`
            : 'none'
        }}
        ref={(el) => {
          if (el) {
            setPathLength(el.getTotalLength());
          }
        }}
      />

      {/* Arrow head */}
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill="hsl(var(--accent))"
        opacity={isMobile ? 0.5 : 0.8}
        style={{
          opacity: shouldAnimate ? 0 : isMobile ? 0.5 : 0.8,
          transition: `opacity ${isMobile ? 400 : 600}ms ease-out`
        }}
      />
    </svg>
  );
};
