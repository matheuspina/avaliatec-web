import { toast } from '@/hooks/use-toast'
import { EvolutionApiError } from '@/lib/services/evolutionApiClient'

/**
 * Toast Helper Utilities
 * 
 * Provides consistent toast notifications for success/error messages
 * with user-friendly error handling and retry mechanisms.
 * 
 * Requirements covered:
 * - 4.6: Show user-friendly error messages for API failures
 * - 12.8: Handle Evolution API connection errors gracefully
 */

export interface ToastErrorOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export interface ToastSuccessOptions {
  title?: string
  description?: string
  duration?: number
}

/**
 * Show success toast with consistent styling
 */
export function showSuccessToast(options: ToastSuccessOptions) {
  return toast({
    title: options.title || 'Sucesso',
    description: options.description,
    duration: options.duration || 3000,
    variant: 'default'
  })
}

/**
 * Show error toast with user-friendly messages
 */
export function showErrorToast(options: ToastErrorOptions) {
  const toastOptions: any = {
    title: options.title || 'Erro',
    description: options.description || 'Ocorreu um erro inesperado',
    variant: 'destructive',
    duration: options.duration || 5000
  }

  // Add action if provided
  if (options.action) {
    toastOptions.action = {
      altText: options.action.label,
      onClick: options.action.onClick,
      children: options.action.label
    }
  }

  return toast(toastOptions)
}

/**
 * Parse API error and show appropriate toast
 */
export function showApiErrorToast(error: unknown, options?: Partial<ToastErrorOptions>) {
  let title = 'Erro'
  let description = 'Ocorreu um erro inesperado'

  // Handle Evolution API errors
  if (error instanceof EvolutionApiError) {
    title = 'Erro do WhatsApp'
    
    switch (error.statusCode) {
      case 400:
        description = 'Dados inválidos. Verifique as informações e tente novamente.'
        break
      case 401:
        description = 'Não autorizado. Verifique as credenciais da API.'
        break
      case 403:
        description = 'Acesso negado. Você não tem permissão para esta ação.'
        break
      case 404:
        description = 'Recurso não encontrado. A instância pode ter sido removida.'
        break
      case 429:
        description = 'Muitas tentativas. Aguarde um momento antes de tentar novamente.'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        description = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
        break
      default:
        description = error.message || 'Erro na comunicação com o WhatsApp'
    }
  }
  // Handle fetch/network errors
  else if (error instanceof TypeError && error.message.includes('fetch')) {
    title = 'Erro de Conexão'
    description = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
  }
  // Handle generic errors
  else if (error instanceof Error) {
    description = error.message
  }
  // Handle API response errors
  else if (typeof error === 'object' && error !== null) {
    const apiError = error as any
    if (apiError.error) {
      description = apiError.error
    }
    if (apiError.message) {
      description = apiError.message
    }
  }

  return showErrorToast({
    title: options?.title || title,
    description: options?.description || description,
    action: options?.action,
    duration: options?.duration
  })
}

/**
 * Show loading toast that can be updated
 */
export function showLoadingToast(message: string = 'Carregando...') {
  return toast({
    title: message,
    description: 'Aguarde...',
    duration: Infinity // Keep until manually dismissed
  })
}

/**
 * WhatsApp-specific toast messages
 */
export const whatsappToasts = {
  // Instance management
  instanceCreated: () => showSuccessToast({
    title: 'Instância criada',
    description: 'Nova instância do WhatsApp foi criada com sucesso'
  }),

  instanceConnected: () => showSuccessToast({
    title: 'WhatsApp conectado',
    description: 'Sua instância foi conectada e está pronta para uso'
  }),

  instanceDisconnected: () => showErrorToast({
    title: 'WhatsApp desconectado',
    description: 'A conexão com o WhatsApp foi perdida. Reconecte para continuar.'
  }),

  instanceDeleted: () => showSuccessToast({
    title: 'Instância removida',
    description: 'A instância do WhatsApp foi removida com sucesso'
  }),

  // Message handling
  messageSent: () => showSuccessToast({
    title: 'Mensagem enviada',
    description: 'Sua mensagem foi enviada com sucesso'
  }),

  messageFailed: (retryFn?: () => void) => showErrorToast({
    title: 'Falha no envio',
    description: 'Não foi possível enviar a mensagem',
    action: retryFn ? {
      label: 'Tentar novamente',
      onClick: retryFn
    } : undefined
  }),

  audioRecordingFailed: () => showErrorToast({
    title: 'Erro na gravação',
    description: 'Não foi possível gravar o áudio. Verifique as permissões do microfone.'
  }),

  // Contact management
  contactUpdated: () => showSuccessToast({
    title: 'Contato atualizado',
    description: 'As informações do contato foram atualizadas'
  }),

  contactAssociated: () => showSuccessToast({
    title: 'Cliente associado',
    description: 'O contato foi associado ao cliente com sucesso'
  }),

  // Settings
  settingsSaved: () => showSuccessToast({
    title: 'Configurações salvas',
    description: 'As configurações foram atualizadas com sucesso'
  }),

  quickMessageSaved: () => showSuccessToast({
    title: 'Mensagem rápida salva',
    description: 'A mensagem rápida foi criada com sucesso'
  }),

  quickMessageDeleted: () => showSuccessToast({
    title: 'Mensagem rápida removida',
    description: 'A mensagem rápida foi removida com sucesso'
  }),

  // Connection issues
  connectionError: (retryFn?: () => void) => showErrorToast({
    title: 'Erro de conexão',
    description: 'Não foi possível conectar ao WhatsApp. Verifique sua conexão.',
    action: retryFn ? {
      label: 'Tentar novamente',
      onClick: retryFn
    } : undefined
  }),

  qrCodeExpired: (retryFn?: () => void) => showErrorToast({
    title: 'QR Code expirado',
    description: 'O QR Code expirou. Gere um novo código para conectar.',
    action: retryFn ? {
      label: 'Gerar novo QR',
      onClick: retryFn
    } : undefined
  }),

  // Permissions
  microphonePermissionDenied: () => showErrorToast({
    title: 'Permissão negada',
    description: 'É necessário permitir o acesso ao microfone para gravar áudios.'
  }),

  // Rate limiting
  rateLimitExceeded: () => showErrorToast({
    title: 'Limite excedido',
    description: 'Muitas mensagens enviadas. Aguarde um momento antes de enviar novamente.',
    duration: 8000
  })
}

/**
 * Utility to handle async operations with toast feedback
 */
export async function withToastFeedback<T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    onSuccess?: (result: T) => void
    onError?: (error: unknown) => void
    showSuccessToast?: boolean
  } = {}
): Promise<T | null> {
  const {
    loadingMessage = 'Processando...',
    successMessage = 'Operação realizada com sucesso',
    errorMessage,
    onSuccess,
    onError,
    showSuccessToast: shouldShowSuccessToast = true
  } = options

  // Show loading toast
  const loadingToastId = showLoadingToast(loadingMessage)

  try {
    const result = await operation()
    
    // Dismiss loading toast
    loadingToastId.dismiss()
    
    // Show success toast
    if (shouldShowSuccessToast) {
      showSuccessToast({ description: successMessage })
    }
    
    // Call success callback
    if (onSuccess) {
      onSuccess(result)
    }
    
    return result
  } catch (error) {
    // Dismiss loading toast
    loadingToastId.dismiss()
    
    // Show error toast
    if (errorMessage) {
      showErrorToast({ description: errorMessage })
    } else {
      showApiErrorToast(error)
    }
    
    // Call error callback
    if (onError) {
      onError(error)
    }
    
    // Log error for debugging
    console.error('Operation failed:', error)
    
    return null
  }
}