const tabs = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'productos', label: 'Productos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'resultados', label: 'Res. Vta' },
  { key: 'cuenta', label: 'Cuenta' },
]

export default function MobileLayout({ title, activeTab, onChangeTab, children }) {
  const showHeader = activeTab !== 'inicio'

  return (
    <div className="app-shell">
      {showHeader && (
        <header className="app-header">
          <div className="app-title">{title}</div>
          <div className="app-subtitle">Cuenta corriente mobile</div>
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
