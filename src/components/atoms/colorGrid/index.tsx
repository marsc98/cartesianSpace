import React, { useState, useRef, useCallback, useEffect } from 'react';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';
import { parseColorToHex } from '../../../utils/color';
import { DEFAULT_COLORS } from '../colorPicker/constants';

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
  setCommonColors: (colors: string[]) => void;
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
  setCommonColors,
}: ColorGridProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [internalColor, setInternalColor] = useState(selectedColor);
  const [inputValue, setInputValue] = useState(selectedColor);
  const [internalOpacity, setInternalOpacity] = useState(opacity);
  const [localColors, setLocalColors] = useState<string[]>(commonColors);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setLocalColors(commonColors); }, [commonColors]);
  useEffect(() => { setInputValue(internalColor.toUpperCase()); }, [internalColor]);

  const internalFinalColor =
    internalOpacity === 1
      ? internalColor
      : `${internalColor}${Math.round(internalOpacity * 255)
          .toString(16)
          .padStart(2, '0')}`;

  const updateColors = (colors: string[]) => {
    setLocalColors(colors);
    setCommonColors(colors);
  };

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const drawColorGrid = useCallback((canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const squareSize = 8;
    const cols = Math.floor(width / squareSize);
    const rows = Math.floor(height / squareSize);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const hue = col / (cols - 1);
        let saturation: number, value: number;
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
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * squareSize, row * squareSize, squareSize, squareSize);
      }
    }
  }, []);

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
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    setInternalColor(hex);
    setSelectedColor(hex);
  }, [setSelectedColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    if (!pos) return;
    pickColor(pos.x, pos.y);
  };

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

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setInternalOpacity(val);
    setOpacity(val);
  };

  const handleColorInputCommit = () => {
    const hex = parseColorToHex(inputValue);
    if (hex) {
      setInternalColor(hex);
      setSelectedColor(hex);
      setInputValue(hex.toUpperCase());
    } else {
      setInputValue(internalColor.toUpperCase());
    }
  };

  const handleCommonColorClickInternal = (color: string) => {
    setInternalColor(color);
    handleCommonColorClick(color);
  };

  const handleRemoveColor = (i: number) => {
    const newArr = localColors.filter((_, idx) => idx !== i);
    updateColors(newArr.length === 0 ? DEFAULT_COLORS : newArr);
    setSelectedForSwap(null);
  };

  const handleSwapSelect = (i: number) => {
    if (selectedForSwap === null) {
      setSelectedForSwap(i);
    } else if (selectedForSwap === i) {
      setSelectedForSwap(null);
    } else {
      const arr = [...localColors];
      [arr[selectedForSwap], arr[i]] = [arr[i], arr[selectedForSwap]];
      updateColors(arr);
      setSelectedForSwap(null);
    }
  };

  const handleAddColor = () => {
    if (localColors.length >= 12) return;
    updateColors([...localColors, internalColor]);
  };

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
          {isHovering && (
            <canvas
              ref={zoomCanvasRef}
              width={30}
              height={30}
              className={css['color-grid-modal__zoom']}
              style={{ left: mousePosition.x + 10, top: mousePosition.y - 40 }}
            />
          )}
        </div>

        <div className={css['color-grid-modal__keyboard-color']}>
          <label htmlFor="color-grid-input" className={css['color-grid-modal__section-label']}>
            Cor:
          </label>
          <input
            id="color-grid-input"
            type="text"
            inputMode="text"
            className={css['color-grid-modal__color-input']}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleColorInputCommit}
            onKeyDown={(e) => e.key === 'Enter' && handleColorInputCommit()}
            spellCheck={false}
            aria-label="Selecionar cor"
          />
        </div>

        <div className={css['color-grid-modal__common-colors-section']}>
          <div className={css['color-grid-modal__common-colors-header']}>
            <label className={css['color-grid-modal__section-label']}>
              Cores Comuns:
            </label>
            <div className={css['color-grid-modal__header-actions']}>
              {localColors.length < 12 && (
                <IconButton
                  iconName="plus"
                  onClick={handleAddColor}
                  size="p"
                  hoverText="Adicionar cor atual"
                />
              )}
              <IconButton
                iconName="edit"
                onClick={() => { setIsEditMode((v) => !v); setSelectedForSwap(null); }}
                size="p"
                isActive={isEditMode}
                hoverText="Editar cores"
              />
            </div>
          </div>
          <div className={css['color-grid-modal__common-colors']}>
            {localColors.map((color, index) => (
              isEditMode ? (
                <div key={index} className={css['color-grid-modal__color-circle-wrapper']}>
                  <button
                    type="button"
                    className={[
                      css['color-grid-modal__color-circle'],
                      selectedForSwap === index ? css['color-grid-modal__color-circle--swap-selected'] : '',
                    ].filter(Boolean).join(' ')}
                    style={{ backgroundColor: color }}
                    onClick={() => handleSwapSelect(index)}
                    title={color.toUpperCase()}
                  />
                  <button
                    type="button"
                    className={css['color-grid-modal__circle-remove']}
                    onClick={() => handleRemoveColor(index)}
                    aria-label={`Remover ${color}`}
                  >×</button>
                </div>
              ) : (
                <button
                  type="button"
                  key={index}
                  className={`${css['color-grid-modal__color-circle']} ${internalColor === color ? css['color-grid-modal__color-circle--selected'] : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleCommonColorClickInternal(color)}
                  title={color.toUpperCase()}
                />
              )
            ))}
          </div>
        </div>

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

        <div className={css['color-grid-modal__color-display']}>
          <div className={css['color-grid-modal__color-swatch-wrapper']}>
            <div className={css['color-grid-modal__checkerboard']}></div>
            <div
              className={css['color-grid-modal__color-swatch']}
              style={{ backgroundColor: internalColor, opacity: internalOpacity }}
            ></div>
          </div>
          <div className={css['color-grid-modal__color-info']}>
            <p className={css['color-grid-modal__color-label']}>Cor Selecionada:</p>
            <p className={css['color-grid-modal__color-value']}>
              {internalFinalColor.toUpperCase()}
            </p>
          </div>
          <div className={css['color-grid-modal__actions']}>
            <IconButton iconName="copy" onClick={copyToClipboard} size="p" hoverText="Copiar cor" />
            <IconButton iconName="colorize" onClick={handleEyeDropper} size="p" hoverText="Selecionar cor da tela" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorGrid;
