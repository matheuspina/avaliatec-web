"use client"

/**
 * EmailListPanel Component
 * Displays the list of emails with search functionality and infinite scroll
 */

import { useEmail } from "@/contexts/email-context"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, MailOpen, Paperclip, RefreshCw, Loader2 } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { format, isToday, isYesterday, isThisYear } from "date-fns"

interface EmailListPanelProps {
  className?: string
  onEmailSelect?: () => void
}

export function EmailListPanel({ className, onEmailSelect }: EmailListPanelProps) {
  const {
    emails,
    selectedEmail,
    selectEmail,
    searchEmails,
    refreshEmails,
    loadMoreEmails,
    loadingEmails,
    hasMoreEmails,
    selectedFolder,
  } = useEmail()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Execute search when debounced query changes
  useEffect(() => {
    searchEmails(debouncedQuery)
  }, [debouncedQuery, searchEmails])

  // Infinite scroll implementation
  const handleLoadMore = useCallback(() => {
    if (!loadingEmails && hasMoreEmails) {
      loadMoreEmails()
    }
  }, [loadingEmails, hasMoreEmails, loadMoreEmails])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          handleLoadMore()
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      }
    )

    observerRef.current.observe(loadMoreTriggerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleLoadMore])

  // Format date for display
  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else if (isThisYear(date)) {
      return format(date, "MMM d")
    } else {
      return format(date, "MMM d, yyyy")
    }
  }

  // Highlight search terms in text
  const highlightSearchTerms = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const handleEmailClick = async (emailId: string) => {
    await selectEmail(emailId)
    // Call callback for mobile viewer
    onEmailSelect?.()
  }

  const handleRefresh = async () => {
    await refreshEmails()
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Search Bar */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search emails"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loadingEmails}
            aria-label="Refresh emails"
          >
            <RefreshCw className={cn("h-4 w-4", loadingEmails && "animate-spin")} />
          </Button>
        </div>
        
        {selectedFolder && (
          <div className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? (
              <span>Search results in {selectedFolder.displayName}</span>
            ) : (
              <span>{selectedFolder.displayName}</span>
            )}
          </div>
        )}
      </div>

      {/* Email List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        role="list"
        aria-label="Email list"
      >
        {loadingEmails && emails.length === 0 ? (
          // Loading skeleton
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : emails.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {searchQuery ? "No emails found matching your search" : "No emails in this folder"}
            </p>
          </div>
        ) : (
          <>
            {emails.map((email) => {
              const isSelected = selectedEmail?.id === email.id
              
              return (
                <button
                  key={email.id}
                  onClick={() => handleEmailClick(email.id)}
                  role="listitem"
                  aria-label={`Email from ${email.from.emailAddress.name}, subject: ${email.subject}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "w-full border-b p-4 text-left transition-colors",
                    "hover:bg-accent/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isSelected && "bg-accent",
                    !email.isRead && "bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Read/Unread Icon */}
                    <div className="mt-1 shrink-0">
                      {email.isRead ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    {/* Email Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                !email.isRead && "font-semibold"
                              )}
                            >
                              {searchQuery
                                ? highlightSearchTerms(email.from.emailAddress.name, searchQuery)
                                : email.from.emailAddress.name}
                            </span>
                            {email.hasAttachments && (
                              <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div
                            className={cn(
                              "mt-1 truncate text-sm",
                              !email.isRead ? "font-medium" : "text-muted-foreground"
                            )}
                          >
                            {searchQuery
                              ? highlightSearchTerms(email.subject || "(No subject)", searchQuery)
                              : email.subject || "(No subject)"}
                          </div>
                          
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {searchQuery
                              ? highlightSearchTerms(email.bodyPreview, searchQuery)
                              : email.bodyPreview}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {formatEmailDate(email.receivedDateTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Load More Trigger */}
            {hasMoreEmails && !searchQuery && (
              <div
                ref={loadMoreTriggerRef}
                className="flex items-center justify-center p-4"
              >
                {loadingEmails && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading more emails...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
