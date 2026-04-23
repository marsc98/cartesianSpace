import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalibrationButton } from './index';

describe('CalibrationButton', () => {
  it('renderiza com label visível', () => {
    render(<CalibrationButton onCalibrate={() => {}} />);
    expect(screen.getByRole('button', { name: 'Calibrar' })).toBeInTheDocument();
  });

  it('chama onCalibrate ao clicar', async () => {
    const onCalibrate = vi.fn();
    render(<CalibrationButton onCalibrate={onCalibrate} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onCalibrate).toHaveBeenCalledOnce();
  });

  it('aplica className ao elemento raiz', () => {
    render(<CalibrationButton onCalibrate={() => {}} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
