import { useState, useRef, useCallback } from 'react';

export interface NotificationData {
  id: number;
  iconName: string;
  variant: string;
  style: string | null;
  exiting: boolean;
}

const useNotifications = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((iconName: string, variant: string, options: { duration?: number, style?: string | null } = {}) => {
    const duration = options.duration ?? 1500;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    const id = Date.now();
    setNotification({ id, iconName, variant, style: options.style ?? null, exiting: false });

    exitTimerRef.current = setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? { ...prev, exiting: true } : prev));
    }, duration);

    dismissTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, duration + 400);
  }, []);

  return { notify, notification };
};

export default useNotifications;
