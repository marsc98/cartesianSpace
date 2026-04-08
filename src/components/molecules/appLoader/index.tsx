import React, { useEffect, useRef } from 'react';
import css from './index.module.scss';

interface AppLoaderProps {
  isExiting: boolean;
  isMobile: boolean;
}

export function AppLoader({ isExiting, isMobile }: AppLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExiting || !loaderRef.current) return;

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const navSizeRem = isMobile ? 4.5 : 6;
    const navSizePx = navSizeRem * rem;
    const navLeftPercent = isMobile ? 40 : 47.5;
    const navCenterX = (navLeftPercent / 100) * window.innerWidth + navSizePx / 2;
    const navCenterY = 10 + navSizePx / 2;

    const loaderRect = loaderRef.current.getBoundingClientRect();
    const loaderCenterX = loaderRect.left + loaderRect.width / 2;
    const loaderCenterY = loaderRect.top + loaderRect.height / 2;

    const dx = navCenterX - loaderCenterX;
    const dy = navCenterY - loaderCenterY;

    loaderRef.current.style.setProperty('--target-x', `calc(-50% + ${dx}px)`);
    loaderRef.current.style.setProperty('--target-y', `calc(-50% + ${dy}px)`);
  }, [isExiting, isMobile]);

  return (
    <div
      ref={loaderRef}
      className={`${css.loaderWrapper} ${isExiting ? css.exiting : ''}`}
    >
      <div className={css.axesGroup}>
        <div className={css.sphere} />

        <div className={`${css.axis} ${css.axisX}`}>
          <div className={css.cone} />
          <div className={css.shaftPos} />
          <div className={css.shaftNeg} />
        </div>

        <div className={`${css.axis} ${css.axisY}`}>
          <div className={css.cone} />
          <div className={css.shaftPos} />
          <div className={css.shaftNeg} />
        </div>

        <div className={`${css.axis} ${css.axisZ}`}>
          <div className={css.cone} />
          <div className={css.shaftPos} />
          <div className={css.shaftNeg} />
        </div>
      </div>
    </div>
  );
}
