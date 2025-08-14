import React from 'react';

interface TrackingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  trackingId: string;
  href?: string;
  type?: 'button' | 'submit' | 'link';
}

export const TrackingButton: React.FC<TrackingButtonProps> = ({
  children,
  onClick,
  className = '',
  trackingId,
  href,
  type = 'button'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Track the event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'engagement',
        event_label: trackingId,
        value: 1
      });
    }
    
    // Call the original onClick if provided
    if (onClick) {
      onClick();
    }
  };

  const commonProps = {
    className,
    'data-gtm': trackingId,
    'data-tracking': trackingId,
    onClick: handleClick
  };

  if (type === 'link' && href) {
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} {...commonProps}>
      {children}
    </button>
  );
};
