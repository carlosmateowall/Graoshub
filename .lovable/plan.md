

## Diagnóstico: Login não redireciona

### Causa raiz

Existe uma **condição de corrida** (race condition) no fluxo de autenticação:

1. Usuário clica "Entrar" → `signIn` retorna sucesso → `navigate("/painel")` é chamado
2. O navegador vai para `/painel` onde `ProtectedRoute` verifica o estado
3. Nesse momento, o `AuthProvider` ainda tem `{ user: null, loading: false }` (estado antigo)
4. `ProtectedRoute` vê `user === null` e `loading === false` → **redireciona de volta para `/login`**
5. Só depois o `onAuthStateChange` dispara e `loadUserData` atualiza o estado com o usuário

O problema está no `loadUserData` em `AuthContext.tsx`: ele **não seta `loading: true`** antes de buscar perfil/role, então há uma janela onde `user` é null e `loading` é false.

### Plano de correção

**Arquivo: `src/contexts/AuthContext.tsx`**

Na função `loadUserData`, adicionar `setState(s => ({ ...s, loading: true }))` no início, antes do `Promise.all`. Assim, quando `onAuthStateChange` dispara, `ProtectedRoute` mostra o loading em vez de redirecionar para `/login`:

```typescript
const loadUserData = useCallback(async (user, session) => {
  if (!user) {
    setState({ user: null, session: null, profile: null, role: null, loading: false });
    return;
  }
  // NOVO: evita que ProtectedRoute redirecione durante o carregamento
  setState(s => ({ ...s, loading: true }));
  const [profile, role] = await Promise.all([fetchProfile(user.id), fetchRole(user.id)]);
  setState({ user, session, profile, role, loading: false });
}, []);
```

Essa é uma mudança de 1 linha que resolve o problema na raiz sem afetar nenhum outro fluxo.

