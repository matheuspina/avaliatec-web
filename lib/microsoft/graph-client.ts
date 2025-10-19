/**
 * Microsoft Graph API Client
 * Provides methods to interact with Microsoft Graph API for email operations
 */

const GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0"

// TypeScript Interfaces
export interface MailFolder {
  id: string
  displayName: string
  unreadItemCount: number
  totalItemCount: number
}

export interface EmailAddress {
  name: string
  address: string
}

export interface EmailMessage {
  id: string
  subject: string
  from: {
    emailAddress: EmailAddress
  }
  receivedDateTime: string
  bodyPreview: string
  isRead: boolean
  hasAttachments: boolean
}

export interface EmailBody {
  contentType: "text" | "html"
  content: string
}

export interface Attachment {
  id: string
  name: string
  contentType: string
  size: number
}

export interface EmailMessageDetail extends EmailMessage {
  body: EmailBody
  toRecipients: Array<{ emailAddress: EmailAddress }>
  ccRecipients: Array<{ emailAddress: EmailAddress }>
  attachments?: Attachment[]
}

interface GraphApiError {
  error: {
    code: string
    message: string
  }
}

export class MicrosoftGraphClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Makes a request to the Microsoft Graph API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GRAPH_API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData: GraphApiError = await response.json()
        throw new Error(
          `Graph API Error: ${errorData.error.code} - ${errorData.error.message}`
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error occurred while calling Graph API")
    }
  }

  /**
   * Get all mail folders for the user
   */
  async getFolders(): Promise<MailFolder[]> {
    const response = await this.makeRequest<{ value: MailFolder[] }>(
      "/me/mailFolders"
    )
    return response.value
  }

  /**
   * Get messages from a specific folder
   */
  async getMessages(
    folderId: string,
    skip: number = 0,
    top: number = 50
  ): Promise<EmailMessage[]> {
    const response = await this.makeRequest<{ value: EmailMessage[] }>(
      `/me/mailFolders/${folderId}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`
    )
    return response.value
  }

  /**
   * Get a single message with full details including body and attachments
   */
  async getMessage(messageId: string): Promise<EmailMessageDetail> {
    const message = await this.makeRequest<EmailMessageDetail>(
      `/me/messages/${messageId}?$expand=attachments`
    )
    return message
  }

  /**
   * Search messages by query string
   */
  async searchMessages(query: string): Promise<EmailMessage[]> {
    const encodedQuery = encodeURIComponent(query)
    const response = await this.makeRequest<{ value: EmailMessage[] }>(
      `/me/messages?$search="${encodedQuery}"&$orderby=receivedDateTime desc`
    )
    return response.value
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.makeRequest(`/me/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    })
  }

  /**
   * Get attachments for a message
   */
  async getAttachments(messageId: string): Promise<Attachment[]> {
    const response = await this.makeRequest<{ value: Attachment[] }>(
      `/me/messages/${messageId}/attachments`
    )
    return response.value
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(
    messageId: string,
    attachmentId: string
  ): Promise<Blob> {
    const url = `${GRAPH_API_BASE_URL}/me/messages/${messageId}/attachments/${attachmentId}/$value`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.statusText}`)
    }

    return await response.blob()
  }
}
