# Guia Rápido - Começando em 5 Minutos

## 1. Credenciais do Supabase

Suas credenciais já estão configuradas no arquivo `.env`:

```
URL: https://hcpirismbhqinnoislyw.supabase.co
ANON KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Primeiro Acesso

### Criar Conta
1. Acesse a aplicação
2. Clique em "Criar Conta"
3. Preencha email e senha
4. Faça login

### Adicionar Primeiro Cliente
1. No dashboard, aba "Clientes"
2. Clique em "Novo Cliente"
3. Preencha o nome (obrigatório)
4. Opcionalmente: CPF/CNPJ, telefone, email, endereço
5. Clique em "Criar"

### Adicionar Máquina
1. Aba "Máquinas"
2. Clique em "Nova Máquina"
3. Selecione o cliente
4. Preencha fabricante, modelo e número de série
5. Marque se está ativa
6. Clique em "Criar"

### Criar Relatório
1. Aba "Relatórios"
2. Clique em "Novo Relatório"
3. Selecione cliente e máquina
4. Adicione título e descrição
5. Escolha o status
6. Clique em "Criar"

## 3. Conectar Android

### Usar Mesmas Credenciais

No seu app Android, use exatamente as mesmas credenciais:

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = "https://hcpirismbhqinnoislyw.supabase.co",
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
) {
    install(Postgrest)
    install(Auth)
}
```

### Exemplo: Buscar Clientes

```kotlin
suspend fun getClientes(): List<Cliente> {
    return supabase
        .from("clientes")
        .select()
        .decodeList<Cliente>()
}
```

## 4. Sincronização

Qualquer mudança feita no painel web:
- ✅ Aparece automaticamente no Android após refresh
- ✅ Usa o mesmo banco de dados PostgreSQL
- ✅ Mesma autenticação
- ✅ Mesmas permissões de segurança

## 5. Estrutura de Dados

### Cliente (Kotlin)
```kotlin
data class Cliente(
    val id: String,
    val nome: String,
    val documento: String? = null,
    val telefone: String? = null,
    val email: String? = null,
    val endereco: String? = null,
    val created_at: String? = null
)
```

### Maquina (Kotlin)
```kotlin
data class Maquina(
    val id: String,
    val cliente_id: String,
    val fabricante: String,
    val modelo: String,
    val numero_serie: String,
    val identificacao: String? = null,
    val codigo_configuracao: String? = null,
    val ano_fabricacao: Int? = null,
    val ativo: Boolean = true,
    val created_at: String? = null
)
```

## 6. Comandos Úteis

```bash
# Ver aplicação rodando
npm run dev

# Buildar para produção
npm run build

# Verificar tipos TypeScript
npm run typecheck
```

## 7. Dashboard Supabase

Acesse o painel do Supabase para:
- Ver dados das tabelas
- Gerenciar usuários
- Configurar permissões
- Ver logs

URL: https://supabase.com/dashboard/project/hcpirismbhqinnoislyw

## 8. Arquitetura

```
┌─────────────┐
│  Painel Web │ ←─┐
└─────────────┘   │
                  ├→  ┌──────────────┐
┌─────────────┐   │   │   Supabase   │
│ App Android │ ←─┘   │  PostgreSQL  │
└─────────────┘       └──────────────┘
```

Ambos compartilham:
- Mesmo banco de dados
- Mesma autenticação
- Mesmas tabelas
- Mesmas políticas de segurança

## 9. Próximos Passos

1. ✅ Adicione clientes e máquinas pelo painel web
2. ✅ Integre com seu app Android existente
3. ✅ Configure Real-time (opcional) para atualizações instantâneas
4. ✅ Personalize os campos conforme sua necessidade

## 10. Suporte

- Documentação completa: [README.md](./README.md)
- Integração Android: [ANDROID_INTEGRATION.md](./ANDROID_INTEGRATION.md)
- Supabase Docs: https://supabase.com/docs
