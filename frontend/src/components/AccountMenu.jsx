import { useState } from 'react'

// Menu compartido de la cuenta (boton ☰): Cambiar clave / Cerrar sesion.
// Lo usan el Home y la barra superior de las demas pantallas (MobileLayout).
// userLabel es opcional: si viene, muestra "Sesion: X" arriba (util donde no
// hay saludo con el nombre, como en las pantallas internas).
export default function AccountMenu({ onChangePassword, onLogout, userLabel }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="home-topbar-menu">
      <button
        className="home-topbar-menu-btn"
        type="button"
        aria-label="Opciones de tu cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      {open && (
        <>
          <div className="home-topbar-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="home-topbar-menu-pop" role="menu">
            {userLabel ? (
              <div className="home-topbar-menu-who">
                Sesión: <strong>{userLabel}</strong>
              </div>
            ) : null}
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onChangePassword() }}>
              Cambiar clave
            </button>
            <button type="button" role="menuitem" className="home-topbar-menu-danger" onClick={() => { setOpen(false); onLogout() }}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )
}
