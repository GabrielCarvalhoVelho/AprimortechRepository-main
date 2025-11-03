import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  Users,
  Cog,
  Database,
  Droplet,
  Beaker,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import ClientesManager from '../components/ClientesManager';
import MaquinasManager from '../components/MaquinasManager';
import RelatoriosManager from '../components/RelatoriosManager';
import TintasManager from '../components/TintasManager';
import SolventesManager from '../components/SolventesManager';

type Tab = 'clientes' | 'maquinas' | 'relatorios' | 'tintas' | 'solventes';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'clientes' as Tab, label: 'Clientes', icon: Users, color: 'blue' },
    { id: 'maquinas' as Tab, label: 'Máquinas', icon: Cog, color: 'orange' },
    { id: 'relatorios' as Tab, label: 'Relatórios', icon: FileText, color: 'green' },
    { id: 'tintas' as Tab, label: 'Tintas', icon: Droplet, color: 'purple' },
    { id: 'solventes' as Tab, label: 'Solventes', icon: Beaker, color: 'teal' },
  ];

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden fixed h-full z-20`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500">Usuário</p>
            <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName || user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                {activeMenuItem && (
                  <>
                    <activeMenuItem.icon className="w-6 h-6 text-blue-600" />
                    <h1 className="text-xl font-bold text-slate-900">{activeMenuItem.label}</h1>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'clientes' && <ClientesManager />}
          {activeTab === 'maquinas' && <MaquinasManager />}
          {activeTab === 'relatorios' && <RelatoriosManager />}
          {activeTab === 'tintas' && <TintasManager />}
          {activeTab === 'solventes' && <SolventesManager />}
        </main>
      </div>
    </div>
  );
}
