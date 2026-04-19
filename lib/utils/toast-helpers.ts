import { toast } from '@/hooks/use-toast'

/**
 * Toast Helper Utilities
 * 
 * Provides consistent toast notifications for success/error messages
 * with user-friendly error handling and retry mechanisms.
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

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
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