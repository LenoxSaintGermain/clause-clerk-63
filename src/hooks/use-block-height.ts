import { useState, useEffect } from 'react';

/**
 * Hook to calculate responsive block height based on viewport width
 */
export const useBlockHeight = (): number => {
  const [blockHeight, setBlockHeight] = useState(350);

  useEffect(() => {
    const updateHeight = () => {
      const width = window.innerWidth;

      if (width < 640) {
        // Mobile
        setBlockHeight(200);
      } else if (width < 1024) {
        // Tablet
        setBlockHeight(280);
      } else {
        // Desktop
        setBlockHeight(350);
      }
    };

    // Initial calculation
    updateHeight();

    // Listen for resize
    window.addEventListener('resize', updateHeight);

    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return blockHeight;
};
