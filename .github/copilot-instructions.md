# AI Coding Agent Instructions - Aprimortech Admin Panel

## Project Overview
React + TypeScript web admin panel for managing clients, machines, maintenance reports, paints (tintas), and solvents. **Shares Firebase backend with an Android app** - all changes sync in real-time between platforms.

**Stack**: React 18, TypeScript, Vite, Firebase (Auth, Firestore, Storage), Tailwind CSS, React Router DOM

## Architecture Patterns

### Firebase as Shared Backend
- **Critical**: Web and Android share the same Firestore database
- Firebase Project ID: `aprimortech-30cad`
- All CRUD operations must consider cross-platform sync implications
- See `ANDROID_INTEGRATION.md` for Android data structure compatibility

### Data Model (src/lib/firebase.ts)
```typescript
// All entities use Firebase Timestamp for dates
// Tintas & Solventes use `codigo` as document ID (not auto-generated)
// Other collections use Firestore auto-generated IDs
```

**Key Relationships**:
- `Maquina.cliente_id` → `Cliente.id`
- `Relatorio.cliente_id` → `Cliente.id`
- `Relatorio.maquina_id` → `Maquina.id` (optional)
- `Relatorio.equipamento.codigo_tinta` → `Tinta.codigo`
- `Relatorio.equipamento.codigo_solvente` → `Solvente.codigo`

### Component Architecture
1. **Manager Components** (`src/components/*Manager.tsx`): Self-contained CRUD modules
   - Pattern: Load data in `useEffect`, display in table, modal for create/edit
   - Always use `Timestamp.now()` for `created_at` fields
   - Always reload full list after mutations (simple, ensures consistency)
   
2. **Context-Based State** (`src/contexts/`):
   - `AuthContext`: Firebase Auth wrapper with `user`, `signIn`, `signUp`, `signOut`
   - `SyncContext`: Placeholder for future real-time sync features (currently stub)

3. **Route Protection**: All routes except `/login` and `/register` require auth via `ProtectedRoute`

## Critical Development Workflows

### Environment Setup
```bash
# Required .env variables (never commit .env)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Start dev server
npm run dev

# Type checking (do this before commits)
npm run typecheck
```

### Standard CRUD Pattern (see ClientesManager.tsx)
```typescript
// 1. Load with ordering
const q = query(collection(firestore, 'collection'), orderBy('field'));
const snapshot = await getDocs(q);

// 2. Create with timestamp
await addDoc(collection(firestore, 'collection'), {
  ...data,
  created_at: Timestamp.now()
});

// 3. Update with doc reference
await updateDoc(doc(firestore, 'collection', id), updates);

// 4. Delete with confirmation
if (!confirm('Tem certeza...')) return;
await deleteDoc(doc(firestore, 'collection', id));

// 5. Always reload after mutations
await loadData();
```

### Special Cases
- **Tintas/Solventes**: Use `setDoc(doc(firestore, 'tintas', codigo), data)` not `addDoc`
- **Relatórios**: Complex nested structure with signatures, equipment data, and Storage attachments
- **File Uploads**: Use Firebase Storage at paths like `relatorios/{relatorioId}/{timestamp}.jpg`

## Firestore Security Rules
Located in `firestore.rules` - **all operations require authentication**:
```javascript
// Pattern: Check auth + validate required fields on create
allow create: if isAuthenticated() && request.resource.data.requiredField is string;
```

## Project-Specific Conventions

### TypeScript
- All interfaces defined in `src/lib/firebase.ts` (single source of truth)
- Use Firebase `Timestamp` type, not Date
- Optional fields marked with `?` and use `|| '-'` for display

### UI/UX Patterns
- **Tailwind CSS**: Use utility classes, no custom CSS files
- **Icons**: Lucide React library (e.g., `<Plus />`, `<Edit2 />`)
- **Modals**: Inline state with `showModal` boolean
- **Loading**: Spinning circle with `border-4 border-blue-600 border-t-transparent rounded-full animate-spin`
- **Colors**: Blue for primary actions, red for delete, slate for neutral

### Form Handling
```typescript
// Standard pattern in all managers
const [formData, setFormData] = useState({ field: '', ... });

// Populate on edit
setFormData(entity ? { 
  field: entity.field || '' 
} : { 
  field: '' 
});

// Submit
await addDoc(collection(firestore, 'name'), {
  ...formData,
  created_at: Timestamp.now()
});
```

### Mobile Responsiveness
- Dashboard sidebar: `lg:w-64` → `w-0` on mobile with hamburger menu
- Tables: Horizontal scroll on small screens
- Forms: Full-width inputs with responsive padding

## Adding New Features

### New Entity Type Checklist
1. Add interface to `src/lib/firebase.ts`
2. Add Firestore collection security rules in `firestore.rules`
3. Create `*Manager.tsx` component following existing pattern
4. Add tab to Dashboard with icon from Lucide
5. Update `ANDROID_INTEGRATION.md` with Kotlin data class
6. Test cross-platform: create in web → verify in Firestore console

### File Upload Feature
```typescript
// Upload to Storage
const storageRef = ref(storage, `path/${id}/${Date.now()}.jpg`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// Store URL in Firestore
await updateDoc(doc(firestore, 'collection', id), {
  attachments: arrayUnion(url)
});
```

## Common Pitfalls

❌ **Don't** use auto-IDs for Tintas/Solventes (use codigo as doc ID)  
❌ **Don't** forget `Timestamp.now()` on creates (Android expects Firestore Timestamp)  
❌ **Don't** modify Firestore structure without updating Android interfaces  
❌ **Don't** commit `.env` file  
✅ **Do** reload data after every mutation for consistency  
✅ **Do** confirm before deletes  
✅ **Do** handle loading states with spinners  
✅ **Do** use `isAuthenticated()` in security rules for all operations

## Key Files Reference
- `src/lib/firebase.ts` - Types and Firebase init
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/components/ClientesManager.tsx` - Reference CRUD implementation
- `firestore.rules` - Security rules (deploy with `firebase deploy --only firestore:rules`)
- `ANDROID_INTEGRATION.md` - Cross-platform integration guide
