import { useEffect, useState } from 'react'
import { loginUser } from '../auth/auth'

export default function LoginPage({ onLoginSuccess, initialMessage = '' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState(initialMessage)

  useEffect(() => {
    setInfoMessage(initialMessage)
  }, [initialMessage])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setInfoMessage('')

    try {
      const user = await loginUser({ username: username.trim(), password })
      onLoginSuccess(user)
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <div className="login-kicker">NERCA POQUET</div>
        <h1 className="login-title">Ingresar</h1>
        <p className="login-text">Accedé con el usuario y contraseña que te entregó el administrador.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Usuario</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="Ingresá tu usuario"
              required
            />
          </label>

          <label className="login-field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Ingresá tu contraseña"
              required
            />
          </label>

          {infoMessage ? <div className="login-info">{infoMessage}</div> : null}
          {error ? <div className="login-error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
