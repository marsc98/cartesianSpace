import React, { useState, useRef, useEffect, useCallback } from 'react';
import IconButton from '../iconButton';
import css from './index.module.scss';
import Item from '../../atoms/item';
import Button from '../../atoms/button';
import Icon from '../../atoms/icon';
import { colorToFilter } from '../../../utils/functions';

type HSL = [number, number, number];

const hexToHsl = (hex: string): HSL => {
  if (!hex) return [0, 0, 0];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

interface CarouselItem {
  id: string;
  src?: string;
  name?: string;
  colorRotation?: number;
}

interface CarouselProps {
  cardSize?: 'p' | 'm';
  isPlane?: boolean;
  cardIsSvg?: boolean;
  selected?: string | null;
  isMobile?: boolean;
  active?: boolean;
  handleSelection: (item: CarouselItem) => void;
  items: CarouselItem[];
  colorRef: React.MutableRefObject<string>;
  label?: string;
  visibleColumns?: number;
}

function Carousel({
  cardSize = 'p',
  isPlane = false,
  cardIsSvg,
  selected,
  isMobile,
  active,
  handleSelection,
  items,
  colorRef,
  label,
  visibleColumns = 3,
}: CarouselProps) {
  const [selectedId, setSelectedId] = useState(selected ?? null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [interpolatedIndex, setInterpolatedIndex] = useState(0);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const lastTime = useRef(0);
  const lastPos = useRef(0);
  const velocity = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldRenderAsList = items.length <= 3;
  const totalColumns = items.length;
  const itemWidth = cardSize === 'm' ? 123.6 : 103;
  const itemHeight = cardSize === 'm' ? 144.2 : 123.6;
  const gapVertical = isMobile ? 15 : 20;

  // Interpolação suave
  useEffect(() => {
    if (shouldRenderAsList) return;

    const interval = setInterval(() => {
      setInterpolatedIndex((prev) => {
        const diff = targetIndex - prev;
        if (Math.abs(diff) < 0.01) return targetIndex;
        return prev + diff * 0.15;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [targetIndex, shouldRenderAsList]);

  // Navegação
  const goUp = () => setTargetIndex((prev) => prev - 0.5);
  const goDown = () => setTargetIndex((prev) => prev + 0.5);

  // Mouse drag
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      const clientY = e.clientY;
      const deltaY = clientY - dragStartX.current;
      const sensitivity = 0.005;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime.current;
      if (timeDiff > 0) {
        const diffY = clientY - lastPos.current;
        velocity.current = diffY / timeDiff;
      }
      lastTime.current = currentTime;
      lastPos.current = clientY;

      setTargetIndex(dragStartIndex.current - deltaY * sensitivity);
    }
  }, []);

  const handleGlobalMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);

      if (Math.abs(velocity.current) > 0.1) {
        setTargetIndex(prev => prev - velocity.current * 0.8);
      }
      velocity.current = 0;
    }
  }, [handleGlobalMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (shouldRenderAsList) return;
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientY;
    lastTime.current = Date.now();
    lastPos.current = e.clientY;
    dragStartIndex.current = targetIndex;

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // Touch drag
  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging.current && e.touches.length === 1) {
      e.preventDefault();
      const clientY = e.touches[0].clientY;
      const deltaY = clientY - dragStartX.current;
      const sensitivity = 0.005;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime.current;
      if (timeDiff > 0) {
        const diffY = clientY - lastPos.current;
        velocity.current = diffY / timeDiff;
      }
      lastTime.current = currentTime;
      lastPos.current = clientY;

      setTargetIndex(dragStartIndex.current - deltaY * sensitivity);
    }
  }, []);

  const handleGlobalTouchEnd = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);

      if (Math.abs(velocity.current) > 0.1) {
        setTargetIndex(prev => prev - velocity.current * 0.8);
      }
      velocity.current = 0;
    }
  }, [handleGlobalTouchMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (shouldRenderAsList) return;
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStartX.current = e.touches[0].clientY;
      lastTime.current = Date.now();
      lastPos.current = e.touches[0].clientY;
      dragStartIndex.current = targetIndex;

      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }
  };

  // Scroll wheel
  const handleWheel = (e) => {
    if (shouldRenderAsList) return;
    e.preventDefault();
    const delta = e.deltaY;
    const sensitivity = 0.002;
    setTargetIndex((prev) => prev + delta * sensitivity);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container && !shouldRenderAsList) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [shouldRenderAsList]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalTouchMove, handleGlobalTouchEnd]);

  const handleSelect = (item: CarouselItem) => {
    if (!isDragging.current) {
      setSelectedId(item.id);
      handleSelection(item);
    }
  };

  const breakableH3 = ({ label = '', maxChunk = 12 }: { label?: string; maxChunk?: number }): React.ReactNode[] => {
    const s = String(label).replace(/\u00A0/g, ' ');
    const out: React.ReactNode[] = [];
    s.split(' ').forEach((word, wi) => {
      if (wi > 0) out.push(' ');
      if (word.length <= maxChunk) {
        out.push(word);
      } else {
        const parts = word.match(new RegExp('.{1,' + maxChunk + '}', 'g')) || [];
        parts.forEach((p, pi) => {
          out.push(p);
          if (pi < parts.length - 1) {
            out.push(<wbr key={`wbr-${wi}-${pi}`} />);
          }
        });
      }
    });
    return out;
  };

  const titleParts = breakableH3({ label: label });

  const containerHeight = shouldRenderAsList
    ? `${items.length * (itemHeight + gapVertical)}px`
    : itemHeight * visibleColumns + gapVertical * (visibleColumns - 1);

  const containerWidth = isMobile ? '100%' : `${itemWidth + 40}px`;

  return (
    <div className={css['carousel-wrapper']}>
      {titleParts.map((part, index) => {
        if (typeof part === 'string' && part.trim() === '') return null;
        return (
          <h3 key={index} className={css['carousel-title']}>
            {part}
          </h3>
        );
      })}

      <div className={css['carousel-container']}>
        {/*!shouldRenderAsList && (
          <div
            className={css['nav-button-top']}
            onClick={goUp}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={css['nav-button-circle']}>
              <Button color="blue" radius={20}>
                <Icon
                  name="coolArrow"
                  size="m"
                  style={{ transform: 'rotate(270deg)', height: '25px' }}
                />
              </Button>
            </div>
          </div>
        )*/}

        <div
          ref={containerRef}
          className={`${css['carousel-viewport']} ${shouldRenderAsList ? css['list-mode'] : ''} ${isDragging.current ? css['dragging'] : ''}`}
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {!shouldRenderAsList && (
            <>
              <div className={css['gradient-top']} />
              <div className={css['gradient-bottom']} />
            </>
          )}

          <div
            className={`${css['items-container']} ${shouldRenderAsList ? css['list-layout'] : ''}`}
          >
            {items.map((item, i) => {
              const column = i;

              if (shouldRenderAsList) {
                return (
                  <div
                    key={item.id + i}
                    style={{
                      marginBottom:
                        i < items.length - 1 ? `${gapVertical}px` : '0',
                    }}
                  >
                    <Item
                      id={item.id}
                      item={item}
                      isSelected={selectedId === item.id && active}
                      colorFilter={colorToFilter(colorRef.current)}
                      colorRef={colorRef}
                      cardSize={cardSize}
                      cardIsSvg={cardIsSvg}
                      isPlane={isPlane}
                      isMobile={isMobile}
                      onClick={() => handleSelect(item)}
                      isListMode={true}
                    />
                  </div>
                );
              }

              // Loop infinito
              const normalizedIndex =
                ((interpolatedIndex % totalColumns) + totalColumns) %
                totalColumns;
              let position = column - normalizedIndex;

              if (position > totalColumns / 2) {
                position -= totalColumns;
              } else if (position < -totalColumns / 2) {
                position += totalColumns;
              }

              const absPos = Math.abs(position);
              const centerHalf = visibleColumns / 2;

              let scale = 1;
              let opacity = 1;
              let zIndex = 100;
              let translateZ = 0;

              if (absPos > centerHalf) {
                const distanceFromEdge = absPos - centerHalf;
                scale = Math.max(0.6, 1 - distanceFromEdge * 0.15);
                opacity = Math.max(0.2, 1 - distanceFromEdge * 0.25);
                zIndex = Math.floor(100 - absPos * 10);
                translateZ = -distanceFromEdge * 40;
              } else {
                zIndex = Math.floor(100 + (centerHalf - absPos) * 10);
              }

              const translateY = position * (itemHeight + gapVertical);

              if (absPos > visibleColumns + 2) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  className={css['carousel-item-wrapper']}
                  style={{
                    transform: `translate(-50%, -50%) translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`,
                    transition: isDragging.current
                      ? 'none'
                      : 'transform 0.3s ease-out, opacity 0.3s ease-out',
                    opacity: opacity,
                    zIndex: zIndex,
                    pointerEvents: absPos < visibleColumns ? 'auto' : 'none',
                  }}
                >
                  <Item
                    id={item.id}
                    item={item}
                    isSelected={selectedId === item.id && active}
                    colorFilter={colorToFilter(colorRef.current)}
                    colorRef={colorRef}
                    cardSize={cardSize}
                    cardIsSvg={cardIsSvg}
                    isPlane={isPlane}
                    isMobile={isMobile}
                    onClick={() => handleSelect(item)}
                    isListMode={false}
                    canHover={absPos < centerHalf}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/*!shouldRenderAsList && (
          <div
            className={css['nav-button-bottom']}
            onClick={goDown}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={css['nav-button-circle']}>
              <Button color="blue" radius={20}>
                <Icon name="coolArrow" size="s" style={{ transform: 'rotate(90deg)', height: '25px' }} />
              </Button>
            </div>
          </div>
        )*/}
      </div>
    </div>
  );
}

export default Carousel;
