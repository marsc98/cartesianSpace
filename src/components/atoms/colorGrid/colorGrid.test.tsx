import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorGrid from './index';
import { DEFAULT_COLORS } from '../colorPicker/constants';

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [255, 0, 0, 255] })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

function makeProps(overrides: Partial<Parameters<typeof ColorGrid>[0]> = {}) {
  return {
    selectedColor: '#ff0000',
    setSelectedColor: vi.fn(),
    opacity: 1,
    setOpacity: vi.fn(),
    commonColors: DEFAULT_COLORS,
    handleCommonColorClick: vi.fn(),
    handleEyeDropper: vi.fn(),
    finalColor: '#ff0000',
    copyToClipboard: vi.fn(),
    setCommonColors: vi.fn(),
    ...overrides,
  };
}

function getEditButton() {
  return document.querySelector('img[alt="edit"]')?.closest('button') ?? null;
}

function getPlusButton() {
  return document.querySelector('img[alt="plus"]')?.closest('button') ?? null;
}

describe('T4 — ColorGrid: input text', () => {
  it('renderiza input de texto (não type=color)', () => {
    render(<ColorGrid {...makeProps()} />);
    const input = document.getElementById('color-grid-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('text');
  });

  it('commit HEX válido atualiza cor interna', async () => {
    const setSelectedColor = vi.fn();
    render(<ColorGrid {...makeProps({ setSelectedColor })} />);
    const input = document.getElementById('color-grid-input') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '#abc');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(setSelectedColor).toHaveBeenCalledWith('#aabbcc');
  });

  it('commit inválido reverte para cor anterior', async () => {
    render(<ColorGrid {...makeProps({ selectedColor: '#ff0000' })} />);
    const input = document.getElementById('color-grid-input') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'invalido');
    fireEvent.blur(input);
    expect(input.value.toLowerCase()).toBe('#ff0000');
  });

  it('label mostra "Cor:"', () => {
    render(<ColorGrid {...makeProps()} />);
    expect(screen.getByText('Cor:')).toBeInTheDocument();
  });
});

describe('T5 — ColorGrid: modo de edição', () => {
  it('botão edit está presente', () => {
    render(<ColorGrid {...makeProps()} />);
    expect(getEditButton()).not.toBeNull();
  });

  it('botão edit alterna modo de edição', async () => {
    render(<ColorGrid {...makeProps()} />);
    await userEvent.click(getEditButton()!);
    expect(screen.getAllByLabelText(/Remover/)).toHaveLength(DEFAULT_COLORS.length);
  });

  it('botão × remove cor da lista', async () => {
    const setCommonColors = vi.fn();
    render(<ColorGrid {...makeProps({ setCommonColors })} />);
    await userEvent.click(getEditButton()!);
    const removeButtons = screen.getAllByLabelText(/Remover/);
    await userEvent.click(removeButtons[0]);
    const callArg = setCommonColors.mock.calls[0][0] as string[];
    expect(callArg).toHaveLength(DEFAULT_COLORS.length - 1);
  });

  it('remover última cor restaura DEFAULT_COLORS', async () => {
    const setCommonColors = vi.fn();
    render(<ColorGrid {...makeProps({ commonColors: ['#ff0000'], setCommonColors })} />);
    await userEvent.click(getEditButton()!);
    const removeBtn = screen.getByLabelText(/Remover/);
    await userEvent.click(removeBtn);
    expect(setCommonColors).toHaveBeenCalledWith(DEFAULT_COLORS);
  });

  it('botão + fica visível quando há menos de 12 cores', () => {
    const fewColors = DEFAULT_COLORS.slice(0, 5);
    render(<ColorGrid {...makeProps({ commonColors: fewColors })} />);
    expect(getPlusButton()).not.toBeNull();
  });

  it('botão + não aparece quando há 12 cores', () => {
    render(<ColorGrid {...makeProps()} />);
    expect(getPlusButton()).toBeNull();
  });

  it('botão + adiciona cor atual', async () => {
    const setCommonColors = vi.fn();
    const fewColors = DEFAULT_COLORS.slice(0, 5);
    render(<ColorGrid {...makeProps({ commonColors: fewColors, setCommonColors })} />);
    await userEvent.click(getPlusButton()!);
    const callArg = setCommonColors.mock.calls[0][0] as string[];
    expect(callArg).toHaveLength(fewColors.length + 1);
  });

  it('swap por clique troca posições', async () => {
    const setCommonColors = vi.fn();
    render(<ColorGrid {...makeProps({ setCommonColors })} />);
    await userEvent.click(getEditButton()!);
    const circleWrappers = document.querySelectorAll('[class*="color-circle-wrapper"]');
    const firstCircle = circleWrappers[0].querySelector('button[style]');
    const thirdCircle = circleWrappers[2].querySelector('button[style]');
    await userEvent.click(firstCircle!);
    await userEvent.click(thirdCircle!);
    const callArg = setCommonColors.mock.calls[0][0] as string[];
    expect(callArg[0]).toBe(DEFAULT_COLORS[2]);
    expect(callArg[2]).toBe(DEFAULT_COLORS[0]);
  });
});
