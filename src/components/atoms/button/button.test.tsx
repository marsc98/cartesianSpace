import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './index'

describe('Button (regular)', () => {
  it('renderiza com texto fornecido', () => {
    render(<Button text="Clique aqui" />)
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument()
  })

  it('chama action ao clicar', async () => {
    const action = vi.fn()
    render(<Button text="OK" action={action} />)
    await userEvent.click(screen.getByRole('button'))
    expect(action).toHaveBeenCalledOnce()
  })

  it('está desabilitado quando disabled=true', () => {
    render(<Button text="Desabilitado" disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('não chama action quando desabilitado', async () => {
    const action = vi.fn()
    render(<Button text="Botão" action={action} disabled />)
    await userEvent.click(screen.getByRole('button'))
    expect(action).not.toHaveBeenCalled()
  })

  it('renderiza children em vez de text quando fornecido', () => {
    render(<Button><span>Filho</span></Button>)
    expect(screen.getByText('Filho')).toBeInTheDocument()
  })
})

describe('Button (href)', () => {
  it('renderiza como link quando href é fornecido', () => {
    render(<Button text="Link" href="https://example.com" />)
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument()
  })

  it('abre em nova aba (target=_blank)', () => {
    render(<Button text="Link" href="https://example.com" />)
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
  })
})

describe('Button (arcade)', () => {
  it('renderiza botão com "PUSH" como fallback quando text não é fornecido', () => {
    render(<Button type="arcade" />)
    expect(screen.getByRole('button', { name: 'PUSH' })).toBeInTheDocument()
  })

  it('renderiza botão arcade com texto customizado', () => {
    render(<Button type="arcade" text="START" />)
    expect(screen.getByRole('button', { name: 'START' })).toBeInTheDocument()
  })

  it('chama action ao clicar no arcade', async () => {
    const action = vi.fn()
    render(<Button type="arcade" action={action} />)
    await userEvent.click(screen.getByRole('button'))
    expect(action).toHaveBeenCalledOnce()
  })
})
