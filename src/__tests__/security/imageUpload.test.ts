import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import ImagesForm from '../../components/molecules/imagesForm';

const makeFile = (size: number, type: string, name: string) =>
  new File([new ArrayBuffer(size)], name, { type });

describe('imagesForm — validação de upload', () => {
  const addImageToScene = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    addImageToScene.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderForm = () =>
    render(React.createElement(ImagesForm, { addImageToScene }));

  const selectFile = (container: HTMLElement, file: File) => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
  };

  it('rejeita arquivo maior que 2MB', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(3 * 1024 * 1024, 'image/png', 'big.png'));
    expect(screen.getByRole('alert').textContent).toMatch(/2MB|grande/i);
  });

  it('rejeita MIME type não permitido mesmo com extensão .png no nome', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(100, 'image/svg+xml', 'malicious.png'));
    expect(screen.getByRole('alert').textContent).toMatch(/tipo|permitido/i);
  });

  it('rejeita arquivo PDF', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(100, 'application/pdf', 'file.pdf'));
    expect(screen.getByRole('alert').textContent).toMatch(/tipo|permitido/i);
  });

  it('aceita PNG válido dentro do limite de tamanho', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(100 * 1024, 'image/png', 'ok.png'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('aceita JPEG válido', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(500 * 1024, 'image/jpeg', 'photo.jpg'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('arquivo rejeitado não é adicionado ao localStorage', () => {
    const { container } = renderForm();
    selectFile(container, makeFile(3 * 1024 * 1024, 'image/png', 'big.png'));
    expect(localStorage.getItem('savedImages')).toBeNull();
  });
});
