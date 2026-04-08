import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from './index'

const options = [
  { value: 'a', label: 'Opção A' },
  { value: 'b', label: 'Opção B' },
  { value: 'c', label: 'Opção C' },
]

describe('Select', () => {
  it('renderiza todas as opções fornecidas', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('option', { name: 'Opção A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Opção B' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Opção C' })).toBeInTheDocument()
  })

  it('renderiza label quando fornecida', () => {
    render(<Select label="Categoria" id="cat" options={options} />)
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument()
  })

  it('não renderiza label quando omitida', () => {
    const { container } = render(<Select options={options} />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('valor selecionado corresponde ao prop value', () => {
    render(<Select options={options} value="b" onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveValue('b')
  })

  it('onChange é chamado ao selecionar opção diferente', async () => {
    const onChange = vi.fn()
    render(<Select options={options} value="a" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'b')
    expect(onChange).toHaveBeenCalled()
  })

  it('renderiza select vazio quando options não é fornecido', () => {
    render(<Select />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
