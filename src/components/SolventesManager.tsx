import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { firestore, Solvente } from '../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function SolventesManager() {
  const [solventes, setSolventes] = useState<Solvente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Solvente | null>(null);
  const [formData, setFormData] = useState({ codigo: '', descricao: '', fabricante: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'solventes'), orderBy('codigo'));
      const snapshot = await getDocs(q);
      setSolventes(snapshot.docs.map(d => ({ ...d.data(), codigo: d.id })) as Solvente[]);
    } catch (error) {
      console.error('Erro ao carregar solventes:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { codigo, ...data } = formData;
      await setDoc(doc(firestore, 'solventes', codigo), data);
      await loadData();
      closeModal();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (codigo: string) => {
    if (!confirm('Excluir?')) return;
    try {
      await deleteDoc(doc(firestore, 'solventes', codigo));
      await loadData();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const openModal = (solvente?: Solvente) => {
    setEditing(solvente || null);
    setFormData(solvente ? { 
      codigo: solvente.codigo, 
      descricao: solvente.descricao || '', 
      fabricante: solvente.fabricante || '' 
    } : { codigo: '', descricao: '', fabricante: '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const filtered = solventes.filter(s => s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || s.descricao?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
        <button onClick={() => openModal()} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700"><Plus className="w-5 h-5" />Novo Solvente</button>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Fabricante</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum solvente</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.codigo} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium">{s.codigo}</td>
                  <td className="px-6 py-4 text-sm">{s.descricao || '-'}</td>
                  <td className="px-6 py-4 text-sm">{s.fabricante || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => openModal(s)} className="text-teal-600 hover:text-teal-800"><Edit2 className="w-4 h-4 inline" /></button>
                    <button onClick={() => handleDelete(s.codigo)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editing ? 'Editar' : 'Novo'} Solvente</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" required disabled={!!editing} value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Descrição</label><input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Fabricante</label><input type="text" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">{editing ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
