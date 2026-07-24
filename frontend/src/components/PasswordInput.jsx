import { useState } from 'react'

// Input de contraseña con boton "ojito" para mostrar/ocultar.
// Mantiene el estilo del input existente (.login-field input) y agrega el toggle.
export default function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
  required = false,
}) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        style={{ width: '100%', paddingRight: '46px', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute',
          right: '6px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '19px',
          lineHeight: 1,
          padding: '6px',
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}
