import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { firestore, Maquina, Cliente } from '../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function MaquinasManager() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Maquina | null>(null);
  const [formData, setFormData] = useState({
    cliente_id: '', fabricante: '', modelo: '', numero_serie: '',
    identificacao: '', codigo_configuracao: '', ano_fabricacao: '', ativo: true
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [maquinasSnap, clientesSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'maquinas'), orderBy('modelo'))),
        getDocs(collection(firestore, 'clientes'))
      ]);
      
      // Mapear documentos vindos tanto em snake_case (web) quanto camelCase (Android)
      const maquinasData = maquinasSnap.docs.map((d) => {
        const data: any = d.data();
        const mapped: Maquina = {
          id: d.id,
          cliente_id: data.cliente_id ?? data.clienteId ?? '',
          fabricante: data.fabricante ?? '',
          modelo: data.modelo ?? '',
          numero_serie: data.numero_serie ?? data.numeroSerie ?? '',
          identificacao: data.identificacao ?? data.identification ?? '',
          codigo_configuracao: data.codigo_configuracao ?? data.codigoConfiguracao ?? '',
          ano_fabricacao:
            data.ano_fabricacao ?? (typeof data.anoFabricacao === 'string' ? parseInt(data.anoFabricacao) : data.anoFabricacao),
          ativo: typeof data.ativo === 'boolean' ? data.ativo : true,
          // created_at não é usado na UI, mas mantém o tipo consistente
          created_at: (data.created_at as any) ?? Timestamp.now(),
        };
        return mapped;
      }) as Maquina[];
      const clientesData = clientesSnap.docs.map(d => ({ 
        id: d.id, 
        nome: d.data().nome,
        ...d.data()
      })) as Cliente[];
      
      console.log('📦 Máquinas carregadas:', maquinasData.length);
      console.log('👥 Clientes carregados:', clientesData.length);
      
      // Verificar máquinas sem cliente_id
      const maquinasSemCliente = maquinasData.filter(m => !m.cliente_id);
      if (maquinasSemCliente.length > 0) {
        console.warn('⚠️ ATENÇÃO: Encontradas', maquinasSemCliente.length, 'máquinas sem cliente_id:');
        console.table(maquinasSemCliente.map(m => ({
          id: m.id,
          modelo: m.modelo,
          fabricante: m.fabricante,
          numero_serie: m.numero_serie
        })));
      }
      
      setMaquinas(maquinasData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Escreve nos dois formatos (snake_case e camelCase) para compatibilidade com Android
    const dataSnake = {
      cliente_id: formData.cliente_id,
      fabricante: formData.fabricante,
      modelo: formData.modelo,
      numero_serie: formData.numero_serie,
      identificacao: formData.identificacao || null,
      codigo_configuracao: formData.codigo_configuracao || null,
      ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao) : null,
      ativo: formData.ativo,
    };
    const dataCamel = {
      clienteId: dataSnake.cliente_id,
      fabricante: dataSnake.fabricante,
      modelo: dataSnake.modelo,
      numeroSerie: dataSnake.numero_serie,
      identificacao: dataSnake.identificacao,
      codigoConfiguracao: dataSnake.codigo_configuracao,
      anoFabricacao: dataSnake.ano_fabricacao,
      ativo: dataSnake.ativo,
    };
    const data = { ...dataSnake, ...dataCamel };
    try {
      if (editing) {
        await updateDoc(doc(firestore, 'maquinas', editing.id), data);
      } else {
        await addDoc(collection(firestore, 'maquinas'), { ...data, created_at: Timestamp.now() });
      }
      await loadData();
      closeModal();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try {
      await deleteDoc(doc(firestore, 'maquinas', id));
      await loadData();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const openModal = (maquina?: Maquina) => {
    setEditing(maquina || null);
    setFormData(maquina ? {
      cliente_id: maquina.cliente_id, fabricante: maquina.fabricante,
      modelo: maquina.modelo, numero_serie: maquina.numero_serie,
      identificacao: maquina.identificacao || '', codigo_configuracao: maquina.codigo_configuracao || '',
      ano_fabricacao: maquina.ano_fabricacao?.toString() || '', ativo: maquina.ativo
    } : { cliente_id: '', fabricante: '', modelo: '', numero_serie: '', identificacao: '', codigo_configuracao: '', ano_fabricacao: '', ativo: true });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const filtered = maquinas.filter(m =>
    m.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.numero_serie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClienteNome = (clienteId: string) => {
    if (!clienteId) {
      console.warn('⚠️ Máquina sem cliente_id');
      return '[Sem Cliente]';
    }
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) {
      console.warn(`⚠️ Cliente não encontrado para ID: ${clienteId}`);
      return `[ID: ${clienteId.substring(0, 8)}...]`;
    }
    return cliente.nome;
  };

  const maquinasSemCliente = maquinas.filter(m => !m.cliente_id);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {maquinasSemCliente.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Atenção: Máquinas sem Cliente</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Existem {maquinasSemCliente.length} máquina(s) sem cliente vinculado (destacadas em amarelo). 
                Clique no ícone de edição para vincular um cliente.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
        <button onClick={() => openModal()} className="px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 hover:bg-orange-700"><Plus className="w-5 h-5" />Nova</button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Fabricante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">N° Série</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhuma máquina</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-50 ${!m.cliente_id ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 text-sm">
                    {!m.cliente_id ? (
                      <span className="text-yellow-700 font-medium flex items-center gap-1">
                        ⚠️ {getClienteNome(m.cliente_id)}
                      </span>
                    ) : (
                      getClienteNome(m.cliente_id)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{m.fabricante}</td>
                  <td className="px-6 py-4 text-sm">{m.modelo}</td>
                  <td className="px-6 py-4 text-sm">{m.numero_serie}</td>
                  <td className="px-6 py-4 text-sm"><span className={'px-2 py-1 text-xs rounded-full ' + (m.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>{m.ativo ? 'Ativa' : 'Inativa'}</span></td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => openModal(m)} className="text-orange-600 hover:text-orange-800"><Edit2 className="w-4 h-4 inline" /></button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editing ? 'Editar' : 'Nova'} Máquina</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Cliente *</label>
                <select required value={formData.cliente_id} onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecione...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Fabricante *</label><input type="text" required value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Modelo *</label><input type="text" required value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Número Série *</label><input type="text" required value={formData.numero_serie} onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Ano</label><input type="number" value={formData.ano_fabricacao} onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Identificação</label><input type="text" value={formData.identificacao} onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Cód. Config</label><input type="text" value={formData.codigo_configuracao} onChange={(e) => setFormData({ ...formData, codigo_configuracao: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="flex items-center gap-2"><input type="checkbox" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} className="rounded" /><span className="text-sm font-medium">Ativa</span></label></div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">{editing ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
