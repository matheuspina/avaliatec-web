/**
 * Quando `EMAIL_LOGIN` é false, o formulário de email/senha em /login fica oculto
 * e apenas o login Microsoft é exibido. Padrão: habilitado (true).
 */
export function isEmailLoginEnabled(): boolean {
  const v = process.env.EMAIL_LOGIN?.toLowerCase().trim()
  if (v === "false" || v === "0" || v === "no") return false
  return true
}
