import React, { useState, useEffect } from 'react';
import css from './index.module.scss';
import IconButton from '../../molecules/iconButton';
import { useModal } from '../../../hooks/useModal';
import ColorGrid from '../colorGrid';
import { useIsMobile } from '../../../hooks/useIsMobile';

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
  const [opacity, setOpacity] = useState(1);
  const isMobile = useIsMobile();

  const { addModal, removeModal } = useModal();

  // Cores comuns pré-definidas
  const [commonColors, setCommonColors] = useState([
    '#ff0000',
    '#ff8800',
    '#ffff00',
    '#88ff00',
    '#00ff00',
    '#00ff88',
    '#00ffff',
    '#0088ff',
    '#0000ff',
    '#8800ff',
    '#ff00ff',
    '#ff0088',
    '#ffffff',
    '#cccccc',
    '#888888',
    '#444444',
    '#000000',
    '#8B4513',
  ]);

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

  // Função para selecionar cor comum
  const handleCommonColorClick = (color: string) => {
    setSelectedColor(color);
  };

  // Função para usar o eyedropper (seletor de cor da tela)
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
      const rgbaColor: { r: number | null; g: number | null; b: number | null; a: number | null } = { r: null, g: null, b: null, a: null };

      const regex =
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/;
      const match = color.match(regex);

      if (match) {
        rgbaColor.r = parseInt(match[1]);
        rgbaColor.g = parseInt(match[2]);
        rgbaColor.b = parseInt(match[3]);
        rgbaColor.a = parseFloat(match[4]);
      }

      const hexColor = rgbToHex(rgbaColor.r ?? 0, rgbaColor.g ?? 0, rgbaColor.b ?? 0);
      setSelectedColor(hexColor);
    } catch (error) {
      console.log('Seleção de cor cancelada ou erro:', error);
    }
  };

  // Função para abrir modal com grid de cores
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
          handleCommonColorClick={handleCommonColorClick}
          handleEyeDropper={handleEyeDropper}
          finalColor={finalColor}
          copyToClipboard={copyToClipboard}
        />
      ),
      onClose: () => {
        removeModal(id);
      },
    });
  };

  React.useEffect(() => {
    if (isMobile) {
      setCommonColors(['#ffffff', '#000000', '#d60000', '#494949']);
    }
  }, [isMobile]);

  // Gerar cor final com opacidade
  const finalColor =
    opacity === 1
      ? selectedColor
      : `${selectedColor}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalColor);
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err);
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
        {/* Círculos de cores comuns */}
        <div
          className={css['color-picker__common-colors']}
          data-is-mobile={isMobile}
        >
          {commonColors.map((color, index) => (
            <button
              type="button"
              key={index}
              className={`${css['color-picker__color-circle']} ${selectedColor === color ? css['color-picker__color-circle--selected'] : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleCommonColorClick(color)}
              title={color.toUpperCase()}
            />
          ))}
        </div>

        <IconButton
          className={css['color-picker__expand-button']}
          iconName="palette"
          onClick={toggleExpanded}
          size={isMobile ? 'p' : 'm'}
        />

        {/* Display da cor selecionada compacto */}
        <div className={css['color-picker__compact-display']}>
          <div className={css['color-picker__compact-swatch-container']}>
            <div
              className={css['color-picker__compact-swatch']}
              style={{ backgroundColor: selectedColor }}
            />
            <span className={css['color-picker__compact-value']}>
              {selectedColor.toUpperCase()}
            </span>
          </div>
          <div className={css['color-picker__actions']}>
            <IconButton iconName="copy" onClick={copyToClipboard} size="p" />
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
