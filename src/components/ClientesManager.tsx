import { useState, useEffect, useRef } from 'react';
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
import { firestore, Cliente } from '../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ClientesManager() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    documento: '', // exibido como CPF/CNPJ
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const loadGooglePlaces = () => {
    return new Promise<void>((resolve, reject) => {
      const w = window as any;
      if (w.google && w.google.maps && w.google.maps.places) {
        resolve();
        return;
      }
      if (!mapsApiKey) {
        console.warn('Google Maps API key ausente. Defina VITE_GOOGLE_MAPS_API_KEY no .env');
        resolve();
        return;
      }
      const existing = document.getElementById('google-places-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&language=pt-BR&region=BR`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Google Maps JS API'));
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Inicializa Autocomplete quando o modal abre
  useEffect(() => {
    let autocomplete: any;
    if (showModal) {
      loadGooglePlaces().then(() => {
        const w = window as any;
        if (!addressInputRef.current || !w.google?.maps?.places) return;
        autocomplete = new w.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'br' },
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const comps = place.address_components || [];
          const get = (type: string) => {
            const comp = comps.find((c: any) => c.types.includes(type));
            return comp ? comp.long_name : '';
          };
          const city = get('administrative_area_level_2') || get('locality');
          const state = get('administrative_area_level_1');
          const lat = place.geometry?.location?.lat ? place.geometry.location.lat() : undefined;
          const lng = place.geometry?.location?.lng ? place.geometry.location.lng() : undefined;
          setFormData((prev) => ({
            ...prev,
            endereco: place.formatted_address || prev.endereco,
            cidade: city || prev.cidade,
            estado: state || prev.estado,
            latitude: lat ?? prev.latitude,
            longitude: lng ?? prev.longitude,
          }));
        });
      }).catch((e) => console.error(e));
    }
    return () => {
      // nada a limpar explicitamente; o autocomplete é coletado ao fechar o modal
    };
  }, [showModal]);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'clientes'), orderBy('nome'));
      const snapshot = await getDocs(q);
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cliente[];
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Preparar dados no formato do Android (camelCase)
      const dataToSave = {
        // Campos básicos (formato Android)
        nome: formData.nome,
        cnpjCpf: formData.documento || '',
        celular: formData.telefone || '',
        telefone: formData.telefone || '',
        // Endereço completo
        endereco: formData.endereco || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        // Email
        email: formData.email || '',
        // Compatibilidade web (snake_case) - mantém alguns campos
        documento: formData.documento || '',
      };

      if (editingCliente) {
        const clienteRef = doc(firestore, 'clientes', editingCliente.id);
        await updateDoc(clienteRef, dataToSave);
      } else {
        await addDoc(collection(firestore, 'clientes'), {
          ...dataToSave,
          created_at: Timestamp.now()
        });
      }

      await loadClientes();
      closeModal();
    } catch (error: any) {
      alert('Erro ao salvar cliente: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await deleteDoc(doc(firestore, 'clientes', id));
      await loadClientes();
    } catch (error: any) {
      alert('Erro ao excluir cliente: ' + error.message);
    }
  };

  const openModal = (cliente?: Cliente) => {
    setEditingCliente(cliente || null);
    setFormData(cliente ? {
      nome: (cliente as any).nome || '',
      documento: (cliente as any).documento || (cliente as any).cnpjCpf || '',
      telefone: (cliente as any).telefone || (cliente as any).celular || '',
      email: (cliente as any).email || '',
      endereco: (cliente as any).endereco || '',
      numero: (cliente as any).numero || '',
      complemento: (cliente as any).complemento || '',
      cidade: (cliente as any).cidade || '',
      estado: (cliente as any).estado || '',
      latitude: (cliente as any).latitude,
      longitude: (cliente as any).longitude,
    } : {
      nome: '',
      documento: '',
      telefone: '',
      email: '',
      endereco: '',
      numero: '',
      complemento: '',
      cidade: '',
      estado: '',
      latitude: undefined,
      longitude: undefined,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium">{c.nome}</td>
                  <td className="px-6 py-4 text-sm">{c.documento || '-'}</td>
                  <td className="px-6 py-4 text-sm">{c.telefone || '-'}</td>
                  <td className="px-6 py-4 text-sm">{c.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-800">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingCliente ? 'Editar' : 'Novo'} Cliente</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço (Google)</label>
                <input
                  type="text"
                  ref={addressInputRef}
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder={mapsApiKey ? 'Digite a rua/avenida...' : 'Configure VITE_GOOGLE_MAPS_API_KEY no .env'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingCliente ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
