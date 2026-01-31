'use client';

import { useEffect } from 'react';

export default function CertificationNotificationTrigger() {
  useEffect(() => {
    // Generate certification notifications in the background
    const generateNotifications = async () => {
      try {
        await fetch('/api/coach/certifications/generate-notifications', {
          method: 'POST',
        });
      } catch (error) {
        // Silently fail - this is a background operation
        console.error('Failed to generate cert notifications:', error);
      }
    };

    generateNotifications();
  }, []);

  // This component renders nothing - it just triggers the notification generation
  return null;
}
