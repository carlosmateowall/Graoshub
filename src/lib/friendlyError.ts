const errorMap: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha incorretos"],
  [/email not confirmed/i, "E-mail ainda não confirmado. Verifique sua caixa de entrada"],
  [/user already registered/i, "Este e-mail já está cadastrado"],
  [/password.*too short/i, "Senha muito curta — mínimo 6 caracteres"],
  [/password.*too weak/i, "Senha muito fraca — use letras e números"],
  [/email.*invalid/i, "E-mail inválido"],
  [/rate limit/i, "Muitas tentativas. Aguarde um momento"],
  [/network/i, "Erro de conexão. Verifique sua internet"],
  [/fetch/i, "Erro de conexão. Verifique sua internet"],
  [/jwt expired/i, "Sessão expirada. Faça login novamente"],
  [/not authorized/i, "Você não tem permissão para esta ação"],
  [/row.level security/i, "Permissão negada para esta operação"],
  [/duplicate key/i, "Este registro já existe"],
  [/violates.*constraint/i, "Dados inválidos. Verifique os campos"],
  [/storage.*not found/i, "Arquivo não encontrado"],
  [/payload too large/i, "Arquivo muito grande"],
  [/signup.*disabled/i, "Cadastro desativado temporariamente"],
];

export function friendlyError(raw: string): string {
  for (const [pattern, msg] of errorMap) {
    if (pattern.test(raw)) return msg;
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}
