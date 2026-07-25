import Icon from '../components/Icon'
import AccountMenu from '../components/AccountMenu'

const tabs = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'productos', label: 'Productos' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'resultados', label: 'Res. Vta' },
  { key: 'cuenta', label: 'Cuenta' },
]

// Cada pantalla lleva su icono y su tono (el tono pinta la barra + el chip).
const sections = {
  clientes: { icon: 'users', tone: 'clients' },
  productos: { icon: 'package', tone: 'products' },
  proveedores: { icon: 'building', tone: 'account' },
  pagosProveedor: { icon: 'banknote', tone: 'payment' },
  ventas: { icon: 'receipt', tone: 'sale' },
  pagos: { icon: 'banknote', tone: 'payment' },
  resultados: { icon: 'bar', tone: 'results' },
  cuenta: { icon: 'book', tone: 'account' },
  password: { icon: 'lock', tone: 'neutral' },
}

export default function MobileLayout({ title, activeTab, onChangeTab, children, currentUser, onLogout, onChangePassword }) {
  const showHeader = activeTab !== 'inicio'
  const section = sections[activeTab] || { icon: null, tone: 'neutral' }
  const empresaNombre = currentUser?.empresa_nombre || ''
  const usuarioNombre = currentUser?.username || ''

  return (
    <div className="app-shell">
      {showHeader && (
        <header className={`mobile-topbar mobile-topbar-${section.tone}`}>
          <div className="mobile-topbar-left">
            {section.icon && (
              <span className="mobile-topbar-chip">
                <Icon name={section.icon} size={21} />
              </span>
            )}
            <div className="mobile-topbar-title">{title}</div>
          </div>
          <div className="mobile-topbar-right">
            {empresaNombre && <span className="mobile-topbar-empresa">{empresaNombre}</span>}
            <AccountMenu onChangePassword={onChangePassword} onLogout={onLogout} userLabel={usuarioNombre} />
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
