import { useState } from 'react'
import { changePassword } from '../auth/auth'

export default function ChangePasswordPage({ onSuccess, onCancel }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const detail = await changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      })
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setSuccess(detail || 'Contraseña actualizada correctamente.')
      if (onSuccess) {
        onSuccess(detail || 'Contraseña actualizada correctamente.')
      }
    } catch (changeError) {
      setError(changeError.message || 'No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen auth-settings-screen">
      <section className="login-card auth-settings-card">
        <div className="login-kicker">SEGURIDAD</div>
        <h1 className="login-title auth-settings-title">Cambiar contraseña</h1>
        <p className="login-text">Actualizá tu contraseña sin entrar al panel de administración.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Contraseña actual</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Ingresá tu contraseña actual"
              required
            />
          </label>

          <label className="login-field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Ingresá la nueva contraseña"
              required
            />
          </label>

          <label className="login-field">
            <span>Repetir nueva contraseña</span>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(event) => setNewPasswordConfirm(event.target.value)}
              autoComplete="new-password"
              placeholder="Repetí la nueva contraseña"
              required
            />
          </label>

          {error ? <div className="login-error">{error}</div> : null}
          {success ? <div className="login-success">{success}</div> : null}

          <div className="auth-settings-actions">
            <button className="auth-secondary-btn" type="button" onClick={onCancel} disabled={submitting}>
              Volver
            </button>
            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
