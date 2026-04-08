import React, { useRef } from 'react';
import { getContrastColor, colorToFilter } from '../../../utils/functions';
import css from './index.module.scss';

interface PencilCursorProps {
  currentColor?: string;
  setCurrentColor?: (color: string) => void;
  img?: string;
  svgPath?: string;
  color?: string;
  size?: number;
  position: { x: number; y: number };
  loading?: boolean;
}

const PencilCursor = ({
  currentColor,
  setCurrentColor,
  img,
  svgPath,
  color,
  size = 20,
  position,
  loading,
}: PencilCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const activeColor = color || currentColor || '#ff1919';
  const borderColor = getContrastColor(activeColor);
  const imgFilter = colorToFilter(activeColor);

  return (
    <div
      className={loading ? css['pencil-loader'] : undefined}
      ref={cursorRef}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999999999999,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {img && !loading && (
        <img
          src={img}
          style={{ filter: imgFilter }}
          alt="Cursor"
          width={size + 20}
          height={size + 20}
          // viewBox="0 0 32 32"
          viewBox={`0 0 ${32 * (size / 43)} ${32 * (size / 43)}`} // Ajusta dinamicamente
        />
      )}
      {!loading && !img && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size + 10}
          height={size + 10}
          // viewBox="0 0 32 32"
          viewBox={`0 0 ${32 * (size / 43)} ${32 * (size / 43)}`} // Ajusta dinamicamente
        >
          {/*Border circle (slightly larger and using contrasting color)*/}
          <circle
            cx={16 * (size / 43)}
            cy={16 * (size / 43)}
            r={11 * (size / 43)} // Borda ligeiramente maior
            fill="none"
            stroke={borderColor}
            strokeWidth={1.5 * (size / 43)} // Espessura proporcional
          />

          {/*Main colored circle*/}
          <circle
            cx={16 * (size / 43)} // Centraliza corretamente
            cy={16 * (size / 43)}
            r={10 * (size / 43)} // Mantém proporção fixa
            fill={color}
          />
        </svg>
      )}
    </div>
  );
};

export default PencilCursor;
