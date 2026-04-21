import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPicker, { DEFAULT_COLORS } from './index';

vi.mock('../../../hooks/useModal', () => ({
  useModal: () => ({ addModal: vi.fn(), removeModal: vi.fn() }),
}));

vi.mock('../colorGrid', () => ({
  default: () => <div data-testid="color-grid-mock" />,
}));

function makeRef(color = '#ff0000') {
  return { current: color } as React.MutableRefObject<string>;
}

describe('T2 — ColorPicker: 12 cores + palette', () => {
  it('renderiza exatamente 12 círculos de cor', () => {
    render(<ColorPicker colorRef={makeRef()} />);
    const circles = document.querySelectorAll('[class*="color-picker__color-circle"]');
    expect(circles).toHaveLength(12);
  });

  it('__actions contém palette e colorize, não copy', () => {
    render(<ColorPicker colorRef={makeRef()} />);
    expect(document.querySelector('img[alt="palette"]')).toBeInTheDocument();
    expect(document.querySelector('img[alt="colorize"]')).toBeInTheDocument();
    expect(document.querySelector('img[alt="copy"]')).not.toBeInTheDocument();
  });

  it('DEFAULT_COLORS tem exatamente 12 entradas', () => {
    expect(DEFAULT_COLORS).toHaveLength(12);
  });
});

describe('T3 — ColorPicker: input transparente', () => {
  it('renderiza input de texto para valor da cor', () => {
    render(<ColorPicker colorRef={makeRef('#ff0000')} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('commit HEX válido atualiza input', async () => {
    render(<ColorPicker colorRef={makeRef('#ff0000')} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '#00ff00');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('#00FF00');
  });

  it('commit RGB válido converte para hex', async () => {
    render(<ColorPicker colorRef={makeRef('#ff0000')} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'rgb(0, 0, 255)');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('#0000FF');
  });

  it('commit inválido reverte para cor anterior', async () => {
    render(<ColorPicker colorRef={makeRef('#ff0000')} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'naoehcor');
    fireEvent.blur(input);
    expect(input).toHaveValue('#FF0000');
  });
});

describe('T6 — ColorPicker: localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usa DEFAULT_COLORS quando LS vazio', () => {
    render(<ColorPicker colorRef={makeRef()} />);
    const circles = document.querySelectorAll('[class*="color-picker__color-circle"]');
    expect(circles).toHaveLength(DEFAULT_COLORS.length);
  });

  it('usa cores salvas no LS quando válidas', () => {
    const saved = ['#aabbcc', '#112233'];
    localStorage.setItem('cartesian-common-colors', JSON.stringify(saved));
    render(<ColorPicker colorRef={makeRef()} />);
    const circles = document.querySelectorAll('[class*="color-picker__color-circle"]');
    expect(circles).toHaveLength(saved.length);
  });

  it('usa DEFAULT_COLORS quando LS contém valor inválido', () => {
    localStorage.setItem('cartesian-common-colors', 'nao-eh-json');
    render(<ColorPicker colorRef={makeRef()} />);
    const circles = document.querySelectorAll('[class*="color-picker__color-circle"]');
    expect(circles).toHaveLength(DEFAULT_COLORS.length);
  });
});
