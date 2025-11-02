import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

export interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  created_at: Timestamp;
}

export interface Maquina {
  id: string;
  cliente_id: string;
  fabricante: string;
  modelo: string;
  numero_serie: string;
  identificacao?: string;
  codigo_configuracao?: string;
  ano_fabricacao?: number;
  ativo: boolean;
  created_at: Timestamp;
}

export interface Tinta {
  codigo: string;
  descricao?: string;
  fabricante?: string;
  cor_hex?: string;
}

export interface Solvente {
  codigo: string;
  descricao?: string;
  fabricante?: string;
}

export type SignatureRole = 'CLIENT' | 'TECHNICIAN';

export interface Signature {
  id: string;
  role: SignatureRole;
  signer_name?: string;
  signed_at?: number;
  image_url?: string;
}

export interface EquipmentData {
  maquina_id?: string;
  fabricante?: string;
  numero_serie?: string;
  identificacao?: string;
  modelo?: string;
  codigo_configuracao?: string;
  ano_fabricacao?: number;
  codigo_tinta?: string;
  codigo_solvente?: string;
  data_proxima_preventiva?: string;
  hora_proxima_preventiva?: string;
  equipamento_fotos?: string[];
}

export type RelatorioStatus = 'DRAFT' | 'IN_PROGRESS' | 'PRE_SIGNATURE' | 'SIGNATURE_PENDING' | 'FINALIZED';

export interface Relatorio {
  id: string;
  cliente_id: string;
  maquina_id?: string;
  titulo?: string;
  descricao?: string;
  created_by?: string;
  created_at: Timestamp;
  updated_at?: Timestamp;
  status: RelatorioStatus;
  equipamento?: EquipmentData;
  client_signatures?: Signature[];
  technician_signatures?: Signature[];
  attachments?: string[];
  metadata?: Record<string, string>;
}
