import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    let timeoutId: number;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Show the "Back online" message for a few seconds
      timeoutId = window.setTimeout(() => setWasOffline(false), 4000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false); // Reset this when going offline
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  return { isOnline, wasOffline };
};