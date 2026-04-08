import React, { useState, useRef, useCallback } from 'react';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';

interface ColorGridProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  commonColors: string[];
  handleCommonColorClick: (color: string) => void;
  handleEyeDropper: (e: React.MouseEvent) => void;
  finalColor: string;
  copyToClipboard: () => void;
}

const ColorGrid = ({
  selectedColor,
  setSelectedColor,
  opacity,
  setOpacity,
  commonColors,
  handleCommonColorClick,
  handleEyeDropper,
  finalColor,
  copyToClipboard,
}: ColorGridProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [internalColor, setInternalColor] = useState(selectedColor);
  const [internalOpacity, setInternalOpacity] = useState(opacity);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);

  const internalFinalColor =
    internalOpacity === 1
      ? internalColor
      : `${internalColor}${Math.round(internalOpacity * 255)
          .toString(16)
          .padStart(2, '0')}`;

  // Função para converter HSV para RGB
  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Função para converter RGB para HEX
  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  };

  // Função para desenhar o grid de cores em quadrados
  const drawColorGrid = useCallback((canvas: HTMLCanvasElement) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    const squareSize = 8;
    const cols = Math.floor(width / squareSize);
    const rows = Math.floor(height / squareSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const hue = col / (cols - 1);

        let saturation, value;

        if (row < rows / 2) {
          saturation = row / (rows / 2 - 1);
          value = 1;
        } else {
          saturation = 1;
          value = 1 - (row - rows / 2) / (rows / 2 - 1);
        }

        saturation = Math.max(0, Math.min(1, saturation));
        value = Math.max(0, Math.min(1, value));

        const [r, g, b] = hsvToRgb(hue, saturation, value);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          col * squareSize,
          row * squareSize,
          squareSize,
          squareSize,
        );

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(
          col * squareSize,
          row * squareSize,
          squareSize,
          squareSize,
        );
      }
    }
  }, []);

  // Função para desenhar a lupa simples
  const drawZoom = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const zoomCanvas = zoomCanvasRef.current;

    if (!canvas || !zoomCanvas) return;

    const ctx = canvas.getContext('2d');
    const zoomCtx = zoomCanvas.getContext('2d');
    if (!ctx || !zoomCtx) return;

    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

    zoomCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    zoomCtx.beginPath();
    zoomCtx.arc(15, 15, 12, 0, 2 * Math.PI);
    zoomCtx.fill();

    zoomCtx.strokeStyle = '#000';
    zoomCtx.lineWidth = 2;
    zoomCtx.beginPath();
    zoomCtx.arc(15, 15, 12, 0, 2 * Math.PI);
    zoomCtx.stroke();
  }, []);

  const getCanvasPosition = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const pickColor = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    const hex = rgbToHex(r, g, b);
    setInternalColor(hex);
    setSelectedColor(hex);
  }, [setSelectedColor]);

  // Função para lidar com clique no canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    if (!pos) return;
    pickColor(pos.x, pos.y);
  };

  // Função para lidar com movimento do mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    if (!pos) return;
    setMousePosition(pos);
    drawZoom(pos.x, pos.y);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    setIsHovering(true);
    setMousePosition(pos);
    drawZoom(pos.x, pos.y);
  }, [getCanvasPosition, drawZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    setMousePosition(pos);
    drawZoom(pos.x, pos.y);
    pickColor(pos.x, pos.y);
  }, [getCanvasPosition, drawZoom, pickColor]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const pos = getCanvasPosition(touch.clientX, touch.clientY);
    if (pos) pickColor(pos.x, pos.y);
    setIsHovering(false);
  }, [getCanvasPosition, pickColor]);

  // Função para lidar com mudança de opacidade
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setInternalOpacity(val);
    setOpacity(val);
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setInternalColor(hex);
    setSelectedColor(hex);
  };

  const handleCommonColorClickInternal = (color: string) => {
    setInternalColor(color);
    handleCommonColorClick(color);
  };

  // Efeito para desenhar o canvas quando o componente monta
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 360;
      canvas.height = 240;
      drawColorGrid(canvas);
    }
  }, [drawColorGrid]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className={css['color-grid-modal']}>
      <div className={css['color-grid-modal__container']}>
        <div className={css['color-grid-modal__canvas-wrapper']}>
          {/* Canvas principal */}
          <canvas
            ref={canvasRef}
            className={css['color-grid-modal__canvas']}
            role="img"
            aria-label="Gradiente de seleção de cor"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          />

          {/* Lupa circular pequena */}
          {isHovering && (
            <canvas
              ref={zoomCanvasRef}
              width={30}
              height={30}
              className={css['color-grid-modal__zoom']}
              style={{
                left: mousePosition.x + 10,
                top: mousePosition.y - 40,
              }}
            />
          )}
        </div>

        {/* Input de cor para acesso via teclado */}
        <div className={css['color-grid-modal__keyboard-color']}>
          <label htmlFor="color-grid-input" className={css['color-grid-modal__section-label']}>
            Cor (hex):
          </label>
          <input
            id="color-grid-input"
            type="color"
            value={internalColor}
            onChange={handleColorInputChange}
            className={css['color-grid-modal__color-input']}
            aria-label="Selecionar cor"
          />
        </div>

        {/* Cores comuns no popup também */}
        <div className={css['color-grid-modal__common-colors-section']}>
          <label className={css['color-grid-modal__section-label']}>
            Cores Comuns:
          </label>
          <div className={css['color-grid-modal__common-colors']}>
            {commonColors.map((color, index) => (
              <button
                type="button"
                key={index}
                className={`${css['color-grid-modal__color-circle']} ${internalColor === color ? css['color-grid-modal__color-circle--selected'] : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleCommonColorClickInternal(color)}
                title={color.toUpperCase()}
              />
            ))}
          </div>
        </div>

        {/* Seletor de Opacidade */}
        <div className={css['color-grid-modal__opacity-section']}>
          <label className={css['color-grid-modal__opacity-label']}>
            Opacidade: {Math.round(internalOpacity * 100)}%
          </label>
          <div className={css['color-grid-modal__opacity-slider-wrapper']}>
            <span className={css['color-grid-modal__opacity-min']}>0%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={internalOpacity}
              onChange={handleOpacityChange}
              className={css['color-grid-modal__opacity-slider']}
            />
            <span className={css['color-grid-modal__opacity-max']}>100%</span>
          </div>
        </div>

        {/* Display da cor selecionada */}
        <div className={css['color-grid-modal__color-display']}>
          <div className={css['color-grid-modal__color-swatch-wrapper']}>
            {/* Fundo xadrez para transparência */}
            <div className={css['color-grid-modal__checkerboard']}></div>
            {/* Cor com opacidade */}
            <div
              className={css['color-grid-modal__color-swatch']}
              style={{
                backgroundColor: internalColor,
                opacity: internalOpacity,
              }}
            ></div>
          </div>
          <div className={css['color-grid-modal__color-info']}>
            <p className={css['color-grid-modal__color-label']}>
              Cor Selecionada:
            </p>
            <p className={css['color-grid-modal__color-value']}>
              {internalFinalColor.toUpperCase()}
            </p>
          </div>
          {/* Botões de ação */}
          <div className={css['color-grid-modal__actions']}>
            <IconButton
              iconName="copy"
              onClick={copyToClipboard}
              size="p"
              title="Copiar cor"
            />
            <IconButton
              iconName="colorize"
              onClick={handleEyeDropper}
              size="p"
              title="Selecionar cor da tela"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorGrid;
