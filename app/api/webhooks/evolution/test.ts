/**
 * Test utilities for Evolution API webhook
 * 
 * This file contains test data and utilities for testing the webhook endpoint.
 * Use this for manual testing or integration tests.
 */

import { WebhookData } from '@/lib/types'

// Sample webhook payloads for testing

export const sampleMessageUpsertPayload: WebhookData = {
  event: 'MESSAGES_UPSERT',
  instance: 'test-instance',
  data: {
    messages: [
      {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'test-message-id-123'
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'João Silva',
        message: {
          conversation: 'Olá, gostaria de saber mais sobre seus serviços!'
        }
      }
    ]
  },
  destination: 'webhook-destination',
  date_time: new Date().toISOString(),
  sender: 'evolution-api',
  server_url: 'https://evolution-api.com',
  apikey: 'test-api-key'
}

export const sampleConnectionUpdatePayload: WebhookData = {
  event: 'CONNECTION_UPDATE',
  instance: 'test-instance',
  data: {
    state: 'open',
    instance: {
      wid: '5511999999999@s.whatsapp.net'
    }
  },
  destination: 'webhook-destination',
  date_time: new Date().toISOString(),
  sender: 'evolution-api',
  server_url: 'https://evolution-api.com',
  apikey: 'test-api-key'
}

export const sampleQRCodeUpdatePayload: WebhookData = {
  event: 'QRCODE_UPDATED',
  instance: 'test-instance',
  data: {
    qrcode: {
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  },
  destination: 'webhook-destination',
  date_time: new Date().toISOString(),
  sender: 'evolution-api',
  server_url: 'https://evolution-api.com',
  apikey: 'test-api-key'
}

export const sampleContactUpsertPayload: WebhookData = {
  event: 'CONTACTS_UPSERT',
  instance: 'test-instance',
  data: {
    contacts: [
      {
        id: '5511999999999@s.whatsapp.net',
        name: 'João Silva',
        pushName: 'João',
        profilePictureUrl: 'https://example.com/avatar.jpg'
      }
    ]
  },
  destination: 'webhook-destination',
  date_time: new Date().toISOString(),
  sender: 'evolution-api',
  server_url: 'https://evolution-api.com',
  apikey: 'test-api-key'
}

export const sampleMessageUpdatePayload: WebhookData = {
  event: 'MESSAGES_UPDATE',
  instance: 'test-instance',
  data: {
    messages: [
      {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: true,
          id: 'test-message-id-123'
        },
        update: {
          status: 2 // delivered
        }
      }
    ]
  },
  destination: 'webhook-destination',
  date_time: new Date().toISOString(),
  sender: 'evolution-api',
  server_url: 'https://evolution-api.com',
  apikey: 'test-api-key'
}

/**
 * Generate a webhook signature for testing
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const crypto = require('crypto')
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Test webhook endpoint with sample data
 */
export async function testWebhookEndpoint(
  baseUrl: string = 'http://localhost:3000',
  payload: WebhookData = sampleMessageUpsertPayload,
  secret?: string
) {
  const url = `${baseUrl}/api/webhooks/evolution`
  const body = JSON.stringify(payload)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (secret) {
    headers['x-signature-256'] = generateWebhookSignature(body, secret)
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })
    
    const result = await response.json()
    
    console.log('Webhook test result:', {
      status: response.status,
      statusText: response.statusText,
      result
    })
    
    return { response, result }
  } catch (error) {
    console.error('Webhook test error:', error)
    throw error
  }
}

// Example usage:
// testWebhookEndpoint('http://localhost:3000', sampleMessageUpsertPayload, 'your-webhook-secret')