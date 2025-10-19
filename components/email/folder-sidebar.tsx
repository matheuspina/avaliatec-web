"use client"

/**
 * FolderSidebar Component
 * Displays the list of email folders with unread counts
 * Responsive design with mobile drawer support
 */

import { useEmail } from "@/contexts/email-context"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Inbox, Send, FileText, Trash2, Folder } from "lucide-react"

// Map folder names to icons
const folderIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Inbox: Inbox,
  "Sent Items": Send,
  Drafts: FileText,
  "Deleted Items": Trash2,
}

interface FolderSidebarProps {
  className?: string
  onFolderSelect?: () => void
}

export function FolderSidebar({ className, onFolderSelect }: FolderSidebarProps) {
  const { folders, selectedFolder, selectFolder, loadingFolders } = useEmail()

  const handleFolderClick = async (folderId: string) => {
    await selectFolder(folderId)
    // Call callback for mobile drawer close
    onFolderSelect?.()
  }

  const getFolderIcon = (folderName: string) => {
    const Icon = folderIcons[folderName] || Folder
    return Icon
  }

  if (loadingFolders) {
    return (
      <div className={cn("w-full border-r bg-muted/10 p-4 md:w-64", className)}>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full border-r bg-muted/10 p-4 md:w-64", className)}>
      <h2 className="mb-4 text-lg font-semibold">Folders</h2>
      
      <nav className="space-y-1" aria-label="Email folders">
        {folders.map((folder) => {
          const Icon = getFolderIcon(folder.displayName)
          const isSelected = selectedFolder?.id === folder.id
          
          return (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder.id)}
              aria-label={`${folder.displayName} folder${folder.unreadItemCount > 0 ? `, ${folder.unreadItemCount} unread` : ""}`}
              aria-current={isSelected ? "page" : undefined}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "active:scale-[0.98]",
                isSelected && "bg-accent text-accent-foreground font-medium shadow-sm"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{folder.displayName}</span>
              </div>
              
              {folder.unreadItemCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 shrink-0 h-5 min-w-[1.25rem] px-1.5"
                >
                  {folder.unreadItemCount > 99 ? "99+" : folder.unreadItemCount}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>
      
      {folders.length === 0 && !loadingFolders && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
          <Folder className="h-8 w-8 mb-2 opacity-50" />
          <p>No folders found</p>
        </div>
      )}
    </div>
  )
}
