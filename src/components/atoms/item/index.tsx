import React from 'react';
import css from './index.module.scss';

interface ItemData {
  src?: string;
  name?: string;
}

interface ItemProps {
  item: ItemData;
  isSelected?: boolean;
  colorFilter?: string;
  colorRef?: React.MutableRefObject<string>;
  cardSize?: string;
  cardIsSvg?: boolean;
  isPlane?: boolean;
  onClick?: () => void;
  isListMode?: boolean;
  id: string;
  hasNoText?: boolean;
  canHover?: boolean;
  isMobile?: boolean;
  customWidth?: string;
  customHeight?: string;
}

function Item({
  item,
  isSelected,
  colorFilter,
  colorRef,
  cardSize,
  cardIsSvg,
  isPlane,
  onClick,
  isListMode,
  id,
  hasNoText,
  canHover = true,
  isMobile,
  customWidth,
  customHeight,
}: ItemProps) {
  const imgPath = item.src
    ? item.src
    : cardIsSvg
      ? `/images/icons/${id}.svg`
      : isPlane
        ? `/images/planes/${id}.png`
        : `/images/elements/${id}.png`;

  const cardWidth = customWidth ?? (isMobile
    ? '85px'
    : cardSize === 'm'
      ? '120px'
      : hasNoText
        ? 'auto'
        : '100px');
  const cardHeight = customHeight ?? (isMobile && hasNoText
    ? '85px'
    : isMobile
      ? '90px'
      : cardSize === 'm'
        ? '140px'
        : hasNoText
          ? 'auto'
          : '120px');
  const borderColor = isSelected ? colorRef?.current || '#7c9dc9aa' : '#374151';
  const borderWidth = isSelected ? '3px' : '1px';

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (canHover) {
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <div
      key={id}
      title={item.name}
      className={css['carousel-item']}
      style={{
        width: cardWidth,
        height: cardHeight,
        border: `${borderWidth} solid ${borderColor}`,
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        className={css['carousel-item-image']}
        style={{
          width: '90%',
          maxWidth: hasNoText ? '50px' : '100px',
          filter: !isPlane && colorFilter,
        }}
        src={imgPath}
        alt={item.name}
      />
      {item?.name && item?.name !== '' && (
        <span className={css['carousel-item-name']}>{item.name}</span>
      )}
    </div>
  );
}

export default Item;
