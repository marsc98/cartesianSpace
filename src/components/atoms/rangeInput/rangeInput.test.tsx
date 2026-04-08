import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RangeInput from './index'

function renderRangeInput(overrides: Partial<Parameters<typeof RangeInput>[0]> = {}) {
  const sizeRef = { current: 20 }
  return render(
    <RangeInput min={10} max={50} sizeRef={sizeRef} {...overrides} />
  )
}

describe('RangeInput', () => {
  it('renderiza input de tipo range', () => {
    renderRangeInput()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('aplica os atributos min e max no slider', () => {
    renderRangeInput({ min: 5, max: 100 })
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '5')
    expect(slider).toHaveAttribute('max', '100')
  })

  it('valor inicial do slider corresponde ao sizeRef.current', () => {
    const sizeRef = { current: 30 }
    render(<RangeInput min={10} max={50} sizeRef={sizeRef} />)
    expect(screen.getByRole('slider')).toHaveValue('30')
  })

  it('renderiza botões de incremento e decremento', () => {
    renderRangeInput()
    expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
  })

  it('botão "+" incrementa o valor do slider', async () => {
    const sizeRef = { current: 20 }
    render(<RangeInput min={10} max={50} sizeRef={sizeRef} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('20')
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(slider).toHaveValue('21')
  })

  it('botão "-" decrementa o valor do slider', async () => {
    const sizeRef = { current: 20 }
    render(<RangeInput min={10} max={50} sizeRef={sizeRef} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('20')
    await userEvent.click(screen.getByRole('button', { name: '-' }))
    expect(slider).toHaveValue('19')
  })

  it('não decrementa abaixo do min', async () => {
    const sizeRef = { current: 10 }
    render(<RangeInput min={10} max={50} sizeRef={sizeRef} />)
    await userEvent.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByRole('slider')).toHaveValue('10')
  })

  it('não incrementa acima do max', async () => {
    const sizeRef = { current: 50 }
    render(<RangeInput min={10} max={50} sizeRef={sizeRef} />)
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByRole('slider')).toHaveValue('50')
  })
})
