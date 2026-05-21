import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './Input'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  hintTone?: 'muted' | 'success' | 'danger'
  valid?: boolean
}

export function PasswordInput({ label, error, hint, hintTone, valid, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      label={label}
      error={error}
      hint={hint}
      hintTone={hintTone}
      valid={valid}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="flex items-center justify-center w-10 h-10 text-ink-muted active:text-ink rounded-card"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  )
}
