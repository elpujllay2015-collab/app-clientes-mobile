const tabs = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'productos', label: 'Productos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'resultados', label: 'Res. Vta' },
  { key: 'cuenta', label: 'Cuenta' },
]

function formatUserName(user) {
  if (!user) return ''
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return fullName || user.username || ''
}

export default function MobileLayout({ title, activeTab, onChangeTab, children, currentUser, onLogout, onChangePassword }) {
  const showHeader = activeTab !== 'inicio'
  const userName = formatUserName(currentUser)

  return (
    <div className="app-shell">
      {showHeader && (
        <header className="app-header">
          <div>
            <div className="app-title">{title}</div>
            <div className="app-subtitle">Cuenta corriente mobile</div>
          </div>
          <div className="app-header-actions">
            {userName ? <div className="app-user-badge">{userName}</div> : null}
            <button className="app-password-btn" type="button" onClick={onChangePassword}>
              Clave
            </button>
            <button className="app-logout-btn" type="button" onClick={onLogout}>
              Salir
            </button>
          </div>
        </header>
      )}

      <main className={`app-content ${activeTab === 'inicio' ? 'app-content-home' : ''}`}>
        {children}
      </main>

      <nav className="bottom-nav bottom-nav-7">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onChangeTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
