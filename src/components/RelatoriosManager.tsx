import React, { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { Plus, Edit2, Trash2, X, FileText, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Cliente { id: string; nome?: string; telefone?: string; celular?: string; latitude?: number | null; longitude?: number | null; lat?: number | null; lng?: number | null; latitude_raw?: number | null; longitude_raw?: number | null; endereco?: string }
interface Maquina { id: string; modelo?: string; fabricante?: string; clienteId?: string; cliente_id?: string }
interface Relatorio {
  id: string;
  clienteId: string;
  contato?: string;
  maquinaId?: string;
  titulo: string;
  descricao: string;
  status: string;
  tecnicoId?: string;
  tecnicoNome?: string;
  dataServico?: any;
  dataProximaManutencaoPreventiva?: any;
  horasAteProximaManutencaoPreventiva?: number;
  valorHoraTecnica?: number;
  kmQuantidade?: number;
  horaInicio?: string;
  horaTermino?: string;
  observacoes?: string;
  created_at?: any;
}

export default function RelatoriosManager(): JSX.Element {
  const { user } = useAuth();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [relCount, setRelCount] = useState<number>(0);
  const [cliCount, setCliCount] = useState<number>(0);
  const [maqCount, setMaqCount] = useState<number>(0);
  const [rawRelExample, setRawRelExample] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState<Relatorio | null>(null);
  const [viewing, setViewing] = useState<Relatorio | null>(null);
  const [formData, setFormData] = useState({ clienteId: '', contato: '', maquinaId: '', titulo: '', descricao: '', status: 'RASCUNHO', dataProximaManutencaoPreventiva: '', horasAteProximaManutencaoPreventiva: '', horaInicio: '', horaTermino: '', valorHoraTecnica: '', kmQuantidade: '', observacoes: '' });

  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const techBaseLat = (import.meta as any).env?.VITE_TECH_BASE_LAT as string | undefined;
  const techBaseLng = (import.meta as any).env?.VITE_TECH_BASE_LNG as string | undefined;

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Auth user:', user);
      const [relSnap, cliSnap, maqSnap] = await Promise.all([
        getDocs(collection(firestore, 'relatorios')),
        getDocs(collection(firestore, 'clientes')),
        getDocs(collection(firestore, 'maquinas'))
      ]);

  // DEBUG: mostrar resumo dos resultados para troubleshooting
  console.log('Relatorios fetch:', { relCount: relSnap.size, relIds: relSnap.docs.map(d => d.id) });
  console.log('Clientes fetch:', { cliCount: cliSnap.size, cliIds: cliSnap.docs.map(d => d.id) });
  console.log('Maquinas fetch:', { maqCount: maqSnap.size, maqIds: maqSnap.docs.map(d => d.id) });

      let rels = relSnap.docs.map(d => {
        const data: any = d.data();
        // coletar exemplo bruto para diagnóstico
        if (!rawRelExample && Object.keys(data).length > 0) setRawRelExample({ id: d.id, ...data });
        return ({
          id: d.id,
          clienteId: data.clienteId || data.cliente_id || '',
          maquinaId: data.maquinaId || data.maquina_id || '',
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          status: data.status || 'RASCUNHO',
          tecnicoId: data.tecnicoId || data.tecnico_id || '',
          tecnicoNome: data.tecnicoNome || data.tecnico_nome || '',
          dataServico: data.dataServico || data.data_servico || data.created_at,
          horaInicio: data.horaInicio || data.hora_inicio || '',
          horaTermino: data.horaTermino || data.hora_termino || '',
          observacoes: data.observacoes || data.observacoes || '',
          created_at: data.created_at
        }) as Relatorio;
      });

      // Se não encontrou relatórios na coleção root 'relatorios', tentar buscar como subcollection (collectionGroup)
      if ((relSnap.size || rels.length) === 0) {
        try {
          const cg = await getDocs(collectionGroup(firestore, 'relatorios'));
          console.log('Relatorios fetch via collectionGroup:', { count: cg.size, ids: cg.docs.map(d => d.id) });
          if (cg.size > 0) {
            rels = cg.docs.map(d => {
              const data: any = d.data();
              if (!rawRelExample && Object.keys(data).length > 0) setRawRelExample({ id: d.id, ...data });
              return ({
                id: d.id,
                clienteId: data.clienteId || data.cliente_id || '',
                maquinaId: data.maquinaId || data.maquina_id || '',
                titulo: data.titulo || '',
                descricao: data.descricao || '',
                status: data.status || 'RASCUNHO',
                tecnicoId: data.tecnicoId || data.tecnico_id || '',
                tecnicoNome: data.tecnicoNome || data.tecnico_nome || '',
                dataServico: data.dataServico || data.data_servico || data.created_at,
                horaInicio: data.horaInicio || data.hora_inicio || '',
                horaTermino: data.horaTermino || data.hora_termino || '',
                observacoes: data.observacoes || data.observacoes || '',
                created_at: data.created_at
              }) as Relatorio;
            });
          }
        } catch (cgErr) {
          console.error('Erro ao buscar collectionGroup(relatorios):', cgErr);
        }
      }

      const clis = cliSnap.docs.map(d => {
        const data: any = d.data();
        return ({
          id: d.id,
          nome: data.nome || '',
          telefone: data.telefone || data.telefone1 || data.celular || '',
          celular: data.celular || data.telefone || '',
          // várias formas possíveis de armazenar coordenadas
          latitude: data.latitude ?? data.lat ?? data.latitude_raw ?? null,
          longitude: data.longitude ?? data.lng ?? data.longitude_raw ?? null,
          lat: data.lat ?? data.latitude ?? null,
          lng: data.lng ?? data.longitude ?? null,
          latitude_raw: data.latitude_raw ?? null,
          longitude_raw: data.longitude_raw ?? null,
          endereco: data.endereco || data.address || ''
        });
      });
      const maqs = maqSnap.docs.map(d => {
        const data: any = d.data();
        return ({ id: d.id, modelo: data.modelo || '', fabricante: data.fabricante || '', clienteId: data.clienteId || data.cliente_id || '', cliente_id: data.cliente_id || data.clienteId || '' });
      });

  setRelatorios(rels);
  setClientes(clis);
  setMaquinas(maqs);
  setRelCount(relSnap.size || rels.length);
  setCliCount(cliSnap.size || clis.length);
  setMaqCount(maqSnap.size || maqs.length);
    } catch (err) { console.error('Erro loadData:', err); alert('Erro ao carregar dados: ' + (err as Error).message); }
    setLoading(false);
  };

  

  const saveRelatorio = async (id?: string) => {
    const base: any = {
      clienteId: formData.clienteId,
      contato: (formData as any).contato || '',
      maquinaId: formData.maquinaId || '',
      titulo: formData.titulo,
      descricao: formData.descricao,
      dataProximaManutencaoPreventiva: (formData as any).dataProximaManutencaoPreventiva || null,
      horasAteProximaManutencaoPreventiva: (formData as any).horasAteProximaManutencaoPreventiva || null,
      valorHoraTecnica: (formData as any).valorHoraTecnica ? Number((formData as any).valorHoraTecnica) : null,
      kmQuantidade: (formData as any).kmQuantidade ? Number((formData as any).kmQuantidade) : null,
      status: formData.status,
      tecnicoId: user?.uid || '',
      tecnicoNome: user?.displayName || user?.email || '',
      horaInicio: formData.horaInicio || '',
      horaTermino: formData.horaTermino || '',
      observacoes: formData.observacoes || '',
      dataServico: Timestamp.now()
    };

    const snake: any = {
      cliente_id: base.clienteId,
      contato: base.contato,
      maquina_id: base.maquinaId,
      titulo: base.titulo,
      descricao: base.descricao,
      data_proxima_manutencao_preventiva: base.dataProximaManutencaoPreventiva,
      horas_ate_proxima_manutencao_preventiva: base.horasAteProximaManutencaoPreventiva,
      valor_hora_tecnica: base.valorHoraTecnica,
      km_quantidade: base.kmQuantidade,
      status: base.status,
      tecnico_id: base.tecnicoId,
      tecnico_nome: base.tecnicoNome,
      hora_inicio: base.horaInicio,
      hora_termino: base.horaTermino,
      observacoes: base.observacoes,
      data_servico: base.dataServico
    };

    const payload = { ...base, ...snake };
    if (id) return updateDoc(doc(firestore, 'relatorios', id), payload);
    return addDoc(collection(firestore, 'relatorios'), { ...payload, created_at: Timestamp.now() });
  };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { await saveRelatorio(editing?.id); await loadData(); closeModal(); } catch (err: any) { console.error(err); alert('Erro ao salvar relatório: ' + err.message); } };

  const handleDelete = async (id: string) => { if (!confirm('Tem certeza que deseja excluir este relatório?')) return; try { await deleteDoc(doc(firestore, 'relatorios', id)); await loadData(); } catch (err: any) { console.error(err); alert('Erro ao excluir relatório: ' + err.message); } };

  const openModal = (r?: Relatorio) => {
    setEditing(r || null);
    setFormData(r ? {
      clienteId: r.clienteId || '',
      contato: r.contato || '',
      maquinaId: r.maquinaId || '',
      titulo: r.titulo || '',
      descricao: r.descricao || '',
      status: r.status || 'RASCUNHO',
      dataProximaManutencaoPreventiva: (r as any).dataProximaManutencaoPreventiva || '',
      horasAteProximaManutencaoPreventiva: (r as any).horasAteProximaManutencaoPreventiva || '',
      horaInicio: r.horaInicio || '',
      horaTermino: r.horaTermino || '',
      valorHoraTecnica: (r as any).valorHoraTecnica || '',
      kmQuantidade: (r as any).kmQuantidade ? String((r as any).kmQuantidade) : ((r as any).kmQuantidade || ''),
      observacoes: r.observacoes || ''
    } : { clienteId: '', contato: '', maquinaId: '', titulo: '', descricao: '', status: 'RASCUNHO', dataProximaManutencaoPreventiva: '', horasAteProximaManutencaoPreventiva: '', horaInicio: '', horaTermino: '', valorHoraTecnica: '', kmQuantidade: '', observacoes: '' });
    setShowModal(true);
  };
  const openModalForClient = (clienteId: string) => {
    const c = clientes.find(x => x.id === clienteId);
    setEditing(null);
    setFormData({ clienteId, contato: (c as any)?.telefone || (c as any)?.celular || '', maquinaId: '', titulo: c?.nome || '', descricao: '', status: 'RASCUNHO', dataProximaManutencaoPreventiva: '', horasAteProximaManutencaoPreventiva: '', horaInicio: '', horaTermino: '', valorHoraTecnica: '', kmQuantidade: '', observacoes: '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };
  const openViewModal = (r: Relatorio) => { setViewing(r); setShowViewModal(true); };
  const closeViewModal = () => { setViewing(null); setShowViewModal(false); };

  const filtered = relatorios.filter(r => r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || r.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
  // quando cliente mudar no form, preencher contato e calcular KM (ida e volta +20%) se possível
  useEffect(() => {
    const cid = (formData as any).clienteId;
    if (!cid) return;
    const c = clientes.find(x => x.id === cid) as any | undefined;
    if (c) {
      // preencher contato automaticamente
      setFormData((prev) => ({ ...prev, contato: c.telefone || c.celular || prev.contato }));

      // calcular distância via Google Distance Matrix se tivermos chaves e coordenadas
      const lat = c.latitude ?? c.lat ?? c.latitude_raw;
      const lng = c.longitude ?? c.lng ?? c.longitude_raw;
      if (mapsApiKey && techBaseLat && techBaseLng && lat != null && lng != null) {
        const compute = async () => {
          try {
            const origins = `${techBaseLat},${techBaseLng}`;
            const destinations = `${lat},${lng}`;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${mapsApiKey}&mode=driving`;
            const res = await fetch(url);
            const data = await res.json();
            const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value;
            if (meters != null) {
              const idaVoltaMeters = meters * 2;
              const km = Math.round((idaVoltaMeters / 1000) * 1.2); // +20% margem
              setFormData((prev) => ({ ...prev, kmQuantidade: String(km) }));
            }
          } catch (e) {
            console.warn('Erro ao calcular distância:', e);
          }
        };
        compute();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(formData as any).clienteId, clientes]);
  const getClienteNome = (id: string) => { if (!id) return '[Sem Cliente]'; const c = clientes.find(x => x.id === id); return c?.nome || `[ID: ${id.slice(0,8)}...]`; };
  const getMaquinaModelo = (id?: string) => { if (!id) return '-'; const m = maquinas.find(x => x.id === id); return m ? `${m.fabricante || ''} ${m.modelo || ''}`.trim() : `[ID: ${id.slice(0,8)}...]`; };
  const getMaquinasDoCliente = (clienteId: string) => maquinas.filter(m => (m.clienteId || m.cliente_id) === clienteId);
  const getStatusColor = (s: string) => ({ RASCUNHO: 'bg-gray-100 text-gray-700', 'EM ANDAMENTO': 'bg-blue-100 text-blue-700', CONCLUIDO: 'bg-green-100 text-green-700', CANCELADO: 'bg-red-100 text-red-700' } as any)[s] || 'bg-gray-100 text-gray-700';
  const formatDate = (ts: any) => { if (!ts) return '-'; try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('pt-BR'); } catch { return '-'; } };

  if (loading) return (<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"/></div>);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar relatórios..." className="flex-1 px-3 py-2 border rounded-lg" />
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus className="w-5 h-5"/> Novo Relatório</button>
      </div>

      {/* Contadores para diagnóstico rápido */}
      <div className="flex gap-4 items-center text-sm text-slate-600">
        <div className="px-3 py-2 bg-white border rounded">Relatórios: <strong className="ml-1">{relCount}</strong></div>
        <div className="px-3 py-2 bg-white border rounded">Clientes: <strong className="ml-1">{cliCount}</strong></div>
        <div className="px-3 py-2 bg-white border rounded">Máquinas: <strong className="ml-1">{maqCount}</strong></div>
      </div>
      {/* UI limpa: informações de debug removidas para experiência do usuário final */}

      <div className="space-y-4">
        {/* Agrupar relatórios por cliente */}
        {clientes.length === 0 && <div className="p-4 bg-white border rounded text-sm text-slate-500">Nenhum cliente cadastrado.</div>}
        {clientes.map((c) => {
          const rels = filtered.filter(r => r.clienteId === c.id);
          return (
            <div key={c.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{c.nome || '[Cliente sem nome]'}</h3>
                  <span className="text-sm text-slate-500">{rels.length} relatório(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModalForClient(c.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-2 hover:bg-blue-700"><Plus className="w-4 h-4"/> Novo</button>
                </div>
              </div>

              {rels.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Nenhum relatório para este cliente.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {rels.map(r => (
                    <div key={r.id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.nome}</div>
                        <div className="text-xs text-slate-600">{r.titulo || c.nome}</div>
                        <div className="text-xs text-slate-400">{formatDate(r.dataServico || r.created_at)} • {getMaquinaModelo(r.maquinaId)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button title="Visualizar" onClick={() => openViewModal(r)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4"/></button>
                        <button onClick={() => openModal(r)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Relatórios sem cliente */}
        {filtered.filter(r => !r.clienteId).length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">[Sem Cliente]</h3>
              <div className="text-sm text-slate-500">{filtered.filter(r => !r.clienteId).length} relatório(s)</div>
            </div>
            <div className="grid gap-3">
              {filtered.filter(r => !r.clienteId).map(r => (
                <div key={r.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Sem cliente</div>
                    <div className="text-xs text-slate-600">{r.titulo || 'Sem título'}</div>
                    <div className="text-xs text-slate-400">{formatDate(r.dataServico || r.created_at)} • {getMaquinaModelo(r.maquinaId)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Visualizar" onClick={() => openViewModal(r)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4"/></button>
                    <button onClick={() => openModal(r)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editing ? 'Editar' : 'Novo'} Relatório</h2>
              <button onClick={closeModal}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Manutenção preventiva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente *</label>
                  <select
                    required
                    value={(formData as any).clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, maquinaId: '' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contato</label>
                  <input type="text" value={(formData as any).contato || ''} onChange={(e) => setFormData({ ...formData, contato: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Máquina</label>
                  <select
                    value={(formData as any).maquinaId}
                    onChange={(e) => setFormData({ ...formData, maquinaId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!(formData as any).clienteId}
                  >
                    <option value="">Selecione...</option>
                    {getMaquinasDoCliente((formData as any).clienteId).map((m) => (
                      <option key={m.id} value={m.id}>{m.fabricante} {m.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <textarea required value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data próxima manutenção preventiva</label>
                  <input type="date" value={(formData as any).dataProximaManutencaoPreventiva || ''} onChange={(e) => setFormData({ ...formData, dataProximaManutencaoPreventiva: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horas até a próxima manutenção preventiva</label>
                  <input type="number" min={0} value={(formData as any).horasAteProximaManutencaoPreventiva || ''} onChange={(e) => setFormData({ ...formData, horasAteProximaManutencaoPreventiva: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horas (início)</label>
                  <input type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Horas (término)</label>
                  <input type="time" value={formData.horaTermino} onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor hora técnica (R$)</label>
                  <input type="number" min={0} step="0.01" value={(formData as any).valorHoraTecnica || ''} onChange={(e) => setFormData({ ...formData, valorHoraTecnica: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">KM (ida+volta +20%)</label>
                  <input
                    type="text"
                    value={(formData as any).kmQuantidade || ''}
                    onChange={(e) => setFormData({ ...formData, kmQuantidade: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Preencha manualmente ou aguarde cálculo automático"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-6 h-6"/> Detalhes do Relatório</h2>
              <button onClick={closeViewModal}><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Título</label>
                <p className="text-lg font-semibold">{viewing.titulo}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cliente</label>
                  <p>{getClienteNome(viewing.clienteId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Máquina</label>
                  <p>{getMaquinaModelo(viewing.maquinaId)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Descrição</label>
                <p className="whitespace-pre-wrap">{viewing.descricao}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Status</label>
                  <p><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(viewing.status)}`}>{viewing.status}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Hora Início</label>
                  <p>{viewing.horaInicio || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Hora Término</label>
                  <p>{viewing.horaTermino || '-'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Data do Serviço</label>
                <p>{formatDate(viewing.dataServico || viewing.created_at)}</p>
              </div>

              {viewing.tecnicoNome && (<div><label className="text-sm font-medium text-slate-500">Técnico</label><p>{viewing.tecnicoNome}</p></div>)}
              {viewing.observacoes && (<div><label className="text-sm font-medium text-slate-500">Observações</label><p className="whitespace-pre-wrap">{viewing.observacoes}</p></div>)}

              <div className="pt-4"><button onClick={closeViewModal} className="w-full px-4 py-2 bg-slate-100 rounded-lg">Fechar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
