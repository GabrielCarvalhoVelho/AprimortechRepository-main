# Integração Android - Painel Web Firebase

Este painel web compartilha o backend Firebase com seu aplicativo Android. Ambos podem acessar e modificar os mesmos dados em tempo real.

## Configuração do Firebase no Android (Kotlin)

### 1. Adicionar Firebase ao Projeto Android

No seu `build.gradle.kts` (Project):

```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

No seu `build.gradle.kts` (Module):

```kotlin
plugins {
    id("com.google.gms.google-services")
}

dependencies {
    // Firebase BoM (Bill of Materials)
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))

    // Firebase Authentication
    implementation("com.google.firebase:firebase-auth-ktx")

    // Cloud Firestore
    implementation("com.google.firebase:firebase-firestore-ktx")

    // Firebase Storage (para anexos)
    implementation("com.google.firebase:firebase-storage-ktx")

    // Coroutines para operações assíncronas
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.7.3")
}
```

### 2. Configurar google-services.json

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **aprimortech-30cad**
3. Adicione um app Android ou baixe o `google-services.json` existente
4. Coloque o arquivo na pasta `app/` do seu projeto Android

### 3. Inicializar Firebase

O Firebase é inicializado automaticamente. Crie um helper para acesso fácil:

```kotlin
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage

object FirebaseHelper {
    val auth: FirebaseAuth get() = FirebaseAuth.getInstance()
    val firestore: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    val storage: FirebaseStorage get() = FirebaseStorage.getInstance()
}
```

## Estrutura de Dados

### Cliente

```kotlin
data class Cliente(
    val id: String = "",
    val nome: String = "",
    val documento: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val endereco: String? = null,
    val created_at: com.google.firebase.Timestamp = com.google.firebase.Timestamp.now()
)
```

### Máquina

```kotlin
data class Maquina(
    val id: String = "",
    val cliente_id: String = "",
    val fabricante: String = "",
    val modelo: String = "",
    val numero_serie: String = "",
    val identificacao: String? = null,
    val codigo_configuracao: String? = null,
    val ano_fabricacao: Int? = null,
    val ativo: Boolean = true,
    val created_at: com.google.firebase.Timestamp = com.google.firebase.Timestamp.now()
)
```

### Tinta

```kotlin
data class Tinta(
    val codigo: String = "",
    val descricao: String? = null,
    val fabricante: String? = null,
    val cor_hex: String? = null
)
```

### Solvente

```kotlin
data class Solvente(
    val codigo: String = "",
    val descricao: String? = null,
    val fabricante: String? = null
)
```

### Relatório

```kotlin
data class Relatorio(
    val id: String = "",
    val cliente_id: String = "",
    val maquina_id: String? = null,
    val titulo: String? = null,
    val descricao: String? = null,
    val created_by: String? = null,
    val created_at: com.google.firebase.Timestamp = com.google.firebase.Timestamp.now(),
    val updated_at: com.google.firebase.Timestamp? = null,
    val status: String = "DRAFT",
    val equipamento: Map<String, Any>? = null,
    val client_signatures: List<Map<String, Any>>? = null,
    val technician_signatures: List<Map<String, Any>>? = null,
    val attachments: List<String>? = null,
    val metadata: Map<String, String>? = null
)
```

## Operações CRUD

### Autenticação

#### Login

```kotlin
suspend fun signIn(email: String, password: String): Result<Unit> {
    return try {
        FirebaseHelper.auth.signInWithEmailAndPassword(email, password).await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Registro

```kotlin
suspend fun signUp(email: String, password: String, name: String): Result<Unit> {
    return try {
        val result = FirebaseHelper.auth.createUserWithEmailAndPassword(email, password).await()
        result.user?.updateProfile(
            UserProfileChangeRequest.Builder()
                .setDisplayName(name)
                .build()
        )?.await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Logout

```kotlin
fun signOut() {
    FirebaseHelper.auth.signOut()
}
```

### Clientes

#### Buscar Todos os Clientes

```kotlin
suspend fun getClientes(): Result<List<Cliente>> {
    return try {
        val snapshot = FirebaseHelper.firestore
            .collection("clientes")
            .orderBy("nome")
            .get()
            .await()

        val clientes = snapshot.documents.map { doc ->
            doc.toObject(Cliente::class.java)?.copy(id = doc.id) ?: Cliente()
        }
        Result.success(clientes)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Criar Cliente

```kotlin
suspend fun createCliente(cliente: Cliente): Result<String> {
    return try {
        val docRef = FirebaseHelper.firestore
            .collection("clientes")
            .add(cliente)
            .await()
        Result.success(docRef.id)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Atualizar Cliente

```kotlin
suspend fun updateCliente(id: String, updates: Map<String, Any>): Result<Unit> {
    return try {
        FirebaseHelper.firestore
            .collection("clientes")
            .document(id)
            .update(updates)
            .await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Deletar Cliente

```kotlin
suspend fun deleteCliente(id: String): Result<Unit> {
    return try {
        FirebaseHelper.firestore
            .collection("clientes")
            .document(id)
            .delete()
            .await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### Máquinas

#### Buscar Máquinas por Cliente

```kotlin
suspend fun getMaquinasByCliente(clienteId: String): Result<List<Maquina>> {
    return try {
        val snapshot = FirebaseHelper.firestore
            .collection("maquinas")
            .whereEqualTo("cliente_id", clienteId)
            .orderBy("modelo")
            .get()
            .await()

        val maquinas = snapshot.documents.map { doc ->
            doc.toObject(Maquina::class.java)?.copy(id = doc.id) ?: Maquina()
        }
        Result.success(maquinas)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Criar Máquina

```kotlin
suspend fun createMaquina(maquina: Maquina): Result<String> {
    return try {
        val docRef = FirebaseHelper.firestore
            .collection("maquinas")
            .add(maquina)
            .await()
        Result.success(docRef.id)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### Tintas e Solventes

#### Buscar Tintas

```kotlin
suspend fun getTintas(): Result<List<Tinta>> {
    return try {
        val snapshot = FirebaseHelper.firestore
            .collection("tintas")
            .orderBy("codigo")
            .get()
            .await()

        val tintas = snapshot.documents.map { doc ->
            doc.toObject(Tinta::class.java)?.copy(codigo = doc.id) ?: Tinta()
        }
        Result.success(tintas)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

#### Criar Tinta (código como ID)

```kotlin
suspend fun createTinta(tinta: Tinta): Result<Unit> {
    return try {
        FirebaseHelper.firestore
            .collection("tintas")
            .document(tinta.codigo)
            .set(tinta)
            .await()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

## Real-time Updates

Para receber atualizações em tempo real quando o painel web modifica dados:

```kotlin
fun observeClientes(onUpdate: (List<Cliente>) -> Unit) {
    FirebaseHelper.firestore
        .collection("clientes")
        .orderBy("nome")
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("Firebase", "Erro ao observar clientes", error)
                return@addSnapshotListener
            }

            if (snapshot != null) {
                val clientes = snapshot.documents.map { doc ->
                    doc.toObject(Cliente::class.java)?.copy(id = doc.id) ?: Cliente()
                }
                onUpdate(clientes)
            }
        }
}
```

## Upload de Arquivos (Firebase Storage)

### Upload de Imagem

```kotlin
suspend fun uploadImage(uri: Uri, path: String): Result<String> {
    return try {
        val storageRef = FirebaseHelper.storage.reference.child(path)
        val uploadTask = storageRef.putFile(uri).await()
        val downloadUrl = uploadTask.storage.downloadUrl.await()
        Result.success(downloadUrl.toString())
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

### Exemplo: Upload de Foto de Relatório

```kotlin
suspend fun uploadRelatorioPhoto(relatorioId: String, imageUri: Uri): Result<String> {
    val path = "relatorios/$relatorioId/${System.currentTimeMillis()}.jpg"
    return uploadImage(imageUri, path)
}
```

## Segurança

As Firestore Security Rules garantem que:
- Apenas usuários autenticados podem acessar dados
- Validação de campos obrigatórios no servidor
- Proteção contra acesso não autorizado

As regras estão configuradas no arquivo `firestore.rules` do projeto web.

## Benefícios desta Arquitetura

1. **Sincronização Automática**: Mudanças no web aparecem no Android e vice-versa
2. **Backend Único**: Um banco de dados Firestore para tudo
3. **Segurança**: Firestore Security Rules garantem acesso controlado
4. **Escalabilidade**: Firebase cuida de toda infraestrutura
5. **Tempo Real**: Use listeners para atualizações instantâneas
6. **Offline First**: Firestore oferece cache automático offline

## Credenciais Firebase

Seu projeto Firebase:
- **Project ID**: aprimortech-30cad
- **Storage Bucket**: aprimortech-30cad.firebasestorage.app

As credenciais completas estão no arquivo `google-services.json` que você baixa do Firebase Console.

## Recursos Adicionais

- [Documentação Firebase Android](https://firebase.google.com/docs/android/setup)
- [Firestore Android Guide](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Auth Android](https://firebase.google.com/docs/auth/android/start)
- [Firebase Storage Android](https://firebase.google.com/docs/storage/android/start)
