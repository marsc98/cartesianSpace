import React, { useState, useEffect } from 'react';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';
import { useModal } from '../../../hooks/useModal';
import ColorGrid from '../colorGrid';
import { parseColorToHex } from '../../../utils/color';
import { safeGetParsed, safeSetItem, isValidColor } from '../../../utils/storage';
import { DEFAULT_COLORS } from './constants';

interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>;
}
declare global {
  interface Window {
    EyeDropper?: new () => EyeDropper;
  }
}

interface ColorPickerProps {
  currentColor?: string;
  setCurrentColor?: (color: string) => void;
  actualizeColor?: (color: string) => void;
  colorRef: React.MutableRefObject<string>;
  className?: string;
}

export { DEFAULT_COLORS };

const isValidColorArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && (v as unknown[]).every(isValidColor);

const ColorPicker = ({
  currentColor,
  setCurrentColor,
  actualizeColor,
  colorRef,
  className,
}: ColorPickerProps) => {
  const [selectedColor, setSelectedColor] = useState(
    colorRef.current || '#ff0000',
  );
  const [inputValue, setInputValue] = useState(colorRef.current || '#ff0000');
  const [opacity, setOpacity] = useState(1);
  const [commonColors, setCommonColors] = useState<string[]>(() =>
    safeGetParsed('cartesian-common-colors', isValidColorArray) ?? DEFAULT_COLORS
  );

  const { addModal, removeModal } = useModal();

  useEffect(() => {
    setInputValue(selectedColor.toUpperCase());
  }, [selectedColor]);

  const handleColorInputCommit = () => {
    const hex = parseColorToHex(inputValue);
    if (hex) {
      setSelectedColor(hex.toUpperCase());
      setInputValue(hex.toUpperCase());
    } else {
      setInputValue(selectedColor.toUpperCase());
    }
  };

  const updateCommonColors = (colors: string[]) => {
    setCommonColors(colors);
    if (JSON.stringify(colors) === JSON.stringify(DEFAULT_COLORS)) {
      try { localStorage.removeItem('cartesian-common-colors'); } catch {}
    } else {
      safeSetItem('cartesian-common-colors', JSON.stringify(colors));
    }
  };

  const handleEyeDropper = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.EyeDropper) {
      alert(
        'Seu navegador não suporta o seletor de cores da tela. Use um navegador moderno como Chrome, Edge ou Opera.',
      );
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const color = result.sRGBHex;
      const hex = parseColorToHex(color) ?? color;
      setSelectedColor(hex.toUpperCase());
    } catch {
      // cancelled
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();

    const id = `modal-colors-${Date.now()}`;
    addModal({
      id,
      isOpen: true,
      title: 'Cores',
      formId: 'colors-form',
      content: (
        <ColorGrid
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          opacity={opacity}
          setOpacity={setOpacity}
          commonColors={commonColors}
          handleCommonColorClick={(color) => setSelectedColor(color)}
          handleEyeDropper={handleEyeDropper}
          finalColor={finalColor}
          copyToClipboard={copyToClipboard}
          setCommonColors={updateCommonColors}
        />
      ),
      onClose: () => {
        removeModal(id);
      },
    });
  };

  const finalColor =
    opacity === 1
      ? selectedColor
      : `${selectedColor}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalColor);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = finalColor;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (selectedColor) {
      colorRef.current = finalColor;
      if (setCurrentColor) {
        setCurrentColor(finalColor);
      }
      if (actualizeColor) {
        actualizeColor(finalColor);
      }
    }
  }, [finalColor]);

  return (
    <div className={[css['color-picker'], className].filter(Boolean).join(' ')}>
      <div className={css['color-picker__compact']}>
        <div className={css['color-picker__common-colors']}>
          {commonColors.map((color, index) => (
            <button
              type="button"
              key={index}
              className={`${css['color-picker__color-circle']} ${selectedColor === color ? css['color-picker__color-circle--selected'] : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              title={color.toUpperCase()}
            />
          ))}
        </div>

        <div className={css['color-picker__compact-display']}>
          <div className={css['color-picker__compact-swatch-container']}>
            <div
              className={css['color-picker__compact-swatch']}
              style={{ backgroundColor: selectedColor }}
            />
            <input
              type="text"
              className={css['color-picker__compact-value']}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleColorInputCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleColorInputCommit()}
              spellCheck={false}
            />
          </div>
          <div className={css['color-picker__actions']}>
            <IconButton
              iconName="palette"
              onClick={toggleExpanded}
              size="p"
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

export default ColorPicker;
