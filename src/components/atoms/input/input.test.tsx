import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './index'

describe('Input', () => {
  it('renderiza input com placeholder', () => {
    render(<Input placeholder="Digite algo" />)
    expect(screen.getByPlaceholderText('Digite algo')).toBeInTheDocument()
  })

  it('renderiza label quando fornecida', () => {
    render(<Input label="Nome" id="nome" />)
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('não renderiza label quando omitida', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('chama onChange ao digitar', async () => {
    let capturedValue = ''
    const onChange = vi.fn(e => { capturedValue = e.target.value })
    render(<Input onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
    expect(capturedValue).toBe('a')
  })

  it('está desabilitado quando disabled=true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('exibe valor inicial', () => {
    render(<Input value="valor-inicial" onChange={() => {}} />)
    expect(screen.getByDisplayValue('valor-inicial')).toBeInTheDocument()
  })

  it('onKeypress é chamado ao pressionar tecla', async () => {
    const onKeypress = vi.fn()
    render(<Input onKeypress={onKeypress} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'a')
    expect(onKeypress).toHaveBeenCalled()
  })

  it('type="number" renderiza input numérico', () => {
    render(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })
})
