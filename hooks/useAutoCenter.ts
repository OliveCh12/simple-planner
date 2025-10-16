import { useEffect, useCallback } from 'react';

/**
 * Custom hook for automatic centering of selected elements on scroll and window resize
 *
 * @param selectedKey - The key of the element to center (used in data-month-key attribute)
 * @param delay - Delay in milliseconds before centering (default: 100ms)
 * @returns Object with centerElement function to manually trigger centering
 */
export function useAutoCenter(selectedKey: string | null, delay: number = 100) {
  // Function to center an element by its data-month-key
  const centerElement = useCallback((key: string) => {
    const element = document.querySelector(`[data-month-key="${key}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, []);

  // Auto-scroll to selected element when it changes
  useEffect(() => {
    if (selectedKey) {
      // Use setTimeout to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        centerElement(selectedKey);
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedKey, delay, centerElement]);

  // Auto-center on window resize (debounced for performance)
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (selectedKey) {
          centerElement(selectedKey);
        }
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [selectedKey, delay, centerElement]);

  return { centerElement };
}