import React from 'react';
import Icon, { IconName } from '../../atoms/icon';
import css from './index.module.scss';

const PARTICLE_COUNT = 8;
const VARIANT_COLORS = {
  success: '#4ade80',
  error: '#f87171',
  warning: '#fb923c',
  neutral: '#93c5fd',
};

type VariantType = 'success' | 'error' | 'warning' | 'neutral';

interface NotificationData {
  id: number;
  iconName: IconName;
  variant: VariantType;
  style: string | null;
  exiting: boolean;
}

interface NotificationCenterProps {
  notification: NotificationData | null;
  isMobile: boolean;
}

interface ParticlesProps {
  variant: VariantType;
}

const Particles = ({ variant }: ParticlesProps) => {
  const color = VARIANT_COLORS[variant] ?? VARIANT_COLORS.neutral;
  return (
    <div className={css.particles} aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span
          key={i}
          className={css.particle}
          style={{
            '--angle': `${(360 / PARTICLE_COUNT) * i}deg`,
            '--color': color,
            '--delay': `${i * 30}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

const NotificationCenter = ({ notification, isMobile }: NotificationCenterProps) => {
  if (!notification) return null;

  const size = isMobile ? '5rem' : '6rem';
  const isGhost = notification.style === 'ghost';
  const isFlip = notification.style === 'flip';

  return (
    <div
      key={notification.id}
      className={`${css.container}${notification.exiting ? ` ${css.exiting}` : ''}`}
      style={{
        width: size,
        height: size,
        left: isMobile ? '40%' : '47.5%',
        top: 10,
      }}
    >
      <div className={`${css['icon-wrapper']}${isGhost ? ` ${css.ghost}` : ''}`}>
        <Icon
          name={notification.iconName}
          size="p"
          style={isFlip ? { transform: 'scaleX(-1)' } : undefined}
        />
      </div>
      <Particles variant={notification.variant} />
    </div>
  );
};

export default NotificationCenter;
