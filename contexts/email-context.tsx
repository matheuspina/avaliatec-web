"use client"

/**
 * Email Context Provider
 * Manages state for email folders, messages, and user interactions
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  MicrosoftGraphClient,
  MailFolder,
  EmailMessage,
  EmailMessageDetail,
} from "@/lib/microsoft/graph-client"
import {
  getMicrosoftTokenWithRefresh,
  isTokenExpiredError,
  handleTokenExpiration,
} from "@/lib/microsoft/token-manager"

// Context value interface
interface EmailContextValue {
  // State
  folders: MailFolder[]
  selectedFolder: MailFolder | null
  emails: EmailMessage[]
  selectedEmail: EmailMessageDetail | null
  loading: boolean
  loadingFolders: boolean
  loadingEmails: boolean
  loadingEmailDetail: boolean
  error: string | null
  hasMoreEmails: boolean
  
  // Actions
  selectFolder: (folderId: string) => Promise<void>
  selectEmail: (emailId: string) => Promise<void>
  searchEmails: (query: string) => Promise<void>
  refreshFolders: () => Promise<void>
  refreshEmails: () => Promise<void>
  loadMoreEmails: () => Promise<void>
  clearError: () => void
}

// Create context
const EmailContext = createContext<EmailContextValue | undefined>(undefined)

// Provider props
interface EmailProviderProps {
  children: React.ReactNode
}

// Constants
const EMAILS_PER_PAGE = 50

export function EmailProvider({ children }: EmailProviderProps) {
  // State
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<MailFolder | null>(null)
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [selectedEmail, setSelectedEmail] = useState<EmailMessageDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [loadingEmailDetail, setLoadingEmailDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSkip, setCurrentSkip] = useState(0)
  const [hasMoreEmails, setHasMoreEmails] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [graphClient, setGraphClient] = useState<MicrosoftGraphClient | null>(null)

  // Initialize Graph client
  const initializeClient = useCallback(async () => {
    try {
      const result = await getMicrosoftTokenWithRefresh()
      
      if (result.error || !result.token) {
        setError(result.error || "Failed to get access token")
        return null
      }

      const client = new MicrosoftGraphClient(result.token)
      setGraphClient(client)
      return client
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize email client"
      setError(errorMessage)
      return null
    }
  }, [])

  // Handle API errors with token refresh
  const handleApiError = useCallback(async (err: unknown, retryFn: () => Promise<void>) => {
    if (err instanceof Error && isTokenExpiredError(err)) {
      // Try to refresh token
      const newToken = await handleTokenExpiration()
      
      if (newToken) {
        // Reinitialize client and retry
        const client = new MicrosoftGraphClient(newToken)
        setGraphClient(client)
        await retryFn()
        return
      }
    }
    
    // If not a token error or refresh failed, set error message
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
    setError(errorMessage)
  }, [])

  // Load folders
  const loadFolders = useCallback(async (client: MicrosoftGraphClient) => {
    setLoadingFolders(true)
    setError(null)
    
    try {
      const folderList = await client.getFolders()
      setFolders(folderList)
      
      // Auto-select Inbox if available
      const inbox = folderList.find(f => f.displayName === "Inbox")
      if (inbox && !selectedFolder) {
        setSelectedFolder(inbox)
      }
    } catch (err) {
      await handleApiError(err, () => loadFolders(client))
    } finally {
      setLoadingFolders(false)
    }
  }, [selectedFolder, handleApiError])

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const client = await initializeClient()
      
      if (client) {
        await loadFolders(client)
      }
      
      setLoading(false)
    }
    
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load emails for selected folder
  const loadEmails = useCallback(async (
    folderId: string,
    skip: number = 0,
    append: boolean = false
  ) => {
    if (!graphClient) return
    
    setLoadingEmails(true)
    setError(null)
    
    try {
      const emailList = await graphClient.getMessages(folderId, skip, EMAILS_PER_PAGE)
      
      if (append) {
        setEmails(prev => [...prev, ...emailList])
      } else {
        setEmails(emailList)
      }
      
      // Check if there are more emails
      setHasMoreEmails(emailList.length === EMAILS_PER_PAGE)
      setCurrentSkip(skip + emailList.length)
    } catch (err) {
      await handleApiError(err, () => loadEmails(folderId, skip, append))
    } finally {
      setLoadingEmails(false)
    }
  }, [graphClient, handleApiError])

  // Select folder
  const selectFolder = useCallback(async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    
    setSelectedFolder(folder)
    setSelectedEmail(null)
    setSearchQuery("")
    setCurrentSkip(0)
    
    await loadEmails(folderId, 0, false)
  }, [folders, loadEmails])

  // Select email
  const selectEmail = useCallback(async (emailId: string) => {
    if (!graphClient) return
    
    setLoadingEmailDetail(true)
    setError(null)
    
    try {
      const emailDetail = await graphClient.getMessage(emailId)
      setSelectedEmail(emailDetail)
      
      // Mark as read if not already
      if (!emailDetail.isRead) {
        await graphClient.markAsRead(emailId)
        
        // Update the email in the list
        setEmails(prev => prev.map(email => 
          email.id === emailId ? { ...email, isRead: true } : email
        ))
        
        // Update folder unread count
        if (selectedFolder) {
          setSelectedFolder(prev => prev ? {
            ...prev,
            unreadItemCount: Math.max(0, prev.unreadItemCount - 1)
          } : null)
          
          setFolders(prev => prev.map(folder =>
            folder.id === selectedFolder.id
              ? { ...folder, unreadItemCount: Math.max(0, folder.unreadItemCount - 1) }
              : folder
          ))
        }
      }
    } catch (err) {
      await handleApiError(err, () => selectEmail(emailId))
    } finally {
      setLoadingEmailDetail(false)
    }
  }, [graphClient, selectedFolder, handleApiError])

  // Search emails
  const searchEmails = useCallback(async (query: string) => {
    if (!graphClient) return
    
    setSearchQuery(query)
    
    // If query is empty, reload current folder
    if (!query.trim()) {
      if (selectedFolder) {
        setCurrentSkip(0)
        await loadEmails(selectedFolder.id, 0, false)
      }
      return
    }
    
    setLoadingEmails(true)
    setError(null)
    
    try {
      const searchResults = await graphClient.searchMessages(query)
      setEmails(searchResults)
      setHasMoreEmails(false) // Search doesn't support pagination
      setCurrentSkip(0)
    } catch (err) {
      await handleApiError(err, () => searchEmails(query))
    } finally {
      setLoadingEmails(false)
    }
  }, [graphClient, selectedFolder, loadEmails, handleApiError])

  // Refresh folders
  const refreshFolders = useCallback(async () => {
    if (!graphClient) {
      const client = await initializeClient()
      if (client) {
        await loadFolders(client)
      }
      return
    }
    
    await loadFolders(graphClient)
  }, [graphClient, initializeClient, loadFolders])

  // Refresh emails
  const refreshEmails = useCallback(async () => {
    if (!selectedFolder) return
    
    setCurrentSkip(0)
    
    if (searchQuery) {
      await searchEmails(searchQuery)
    } else {
      await loadEmails(selectedFolder.id, 0, false)
    }
  }, [selectedFolder, searchQuery, searchEmails, loadEmails])

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!selectedFolder || !hasMoreEmails || loadingEmails || searchQuery) return
    
    await loadEmails(selectedFolder.id, currentSkip, true)
  }, [selectedFolder, hasMoreEmails, loadingEmails, searchQuery, currentSkip, loadEmails])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: EmailContextValue = {
    folders,
    selectedFolder,
    emails,
    selectedEmail,
    loading,
    loadingFolders,
    loadingEmails,
    loadingEmailDetail,
    error,
    hasMoreEmails,
    selectFolder,
    selectEmail,
    searchEmails,
    refreshFolders,
    refreshEmails,
    loadMoreEmails,
    clearError,
  }

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  )
}

// Custom hook to use email context
export function useEmail() {
  const context = useContext(EmailContext)
  
  if (context === undefined) {
    throw new Error("useEmail must be used within an EmailProvider")
  }
  
  return context
}
