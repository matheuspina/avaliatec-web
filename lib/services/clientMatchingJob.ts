/**
 * Client Matching Background Job
 * 
 * This module provides utilities for running automatic client matching
 * as a background job or scheduled task.
 * 
 * Requirements covered:
 * - 7.1: Verify client with matching phone
 * - 7.2: Associate contact with client
 * - 7.6: Normalize phone numbers
 * - 8.3: Update contact type when matched
 */

import { getWhatsAppService } from './whatsappService'

/**
 * Configuration for client matching job
 */
interface ClientMatchingJobConfig {
  instanceId?: string
  batchSize?: number
  delayBetweenBatches?: number
  maxRetries?: number
}

/**
 * Result of client matching job execution
 */
interface ClientMatchingJobResult {
  success: boolean
  matchedCount: number
  totalProcessed: number
  errors: string[]
  executionTime: number
}

/**
 * Run client matching job with configuration options
 * 
 * @param config - Job configuration options
 * @returns Job execution result
 */
export async function runClientMatchingJob(
  config: ClientMatchingJobConfig = {}
): Promise<ClientMatchingJobResult> {
  const startTime = Date.now()
  const {
    instanceId,
    batchSize = 10,
    delayBetweenBatches = 100,
    maxRetries = 3
  } = config

  const result: ClientMatchingJobResult = {
    success: false,
    matchedCount: 0,
    totalProcessed: 0,
    errors: [],
    executionTime: 0
  }

  try {
    console.log('Starting client matching background job...', {
      instanceId: instanceId || 'all',
      batchSize,
      delayBetweenBatches
    })

    const whatsappService = getWhatsAppService()
    
    let attempt = 0
    let lastError: Error | null = null

    // Retry logic for resilience
    while (attempt < maxRetries) {
      try {
        const matchedCount = await whatsappService.runAutomaticClientMatching(instanceId)
        
        result.success = true
        result.matchedCount = matchedCount
        result.totalProcessed = matchedCount // In this case, processed = matched
        
        console.log(`Client matching job completed successfully. Matched ${matchedCount} contacts.`)
        break
        
      } catch (error) {
        attempt++
        lastError = error instanceof Error ? error : new Error(String(error))
        
        console.error(`Client matching job attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`Retrying in ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    if (!result.success && lastError) {
      result.errors.push(lastError.message)
      console.error('Client matching job failed after all retries:', lastError)
    }

  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
    console.error('Critical error in client matching job:', error)
  }

  result.executionTime = Date.now() - startTime
  
  console.log('Client matching job finished:', {
    success: result.success,
    matchedCount: result.matchedCount,
    executionTime: `${result.executionTime}ms`,
    errors: result.errors.length
  })

  return result
}

/**
 * Schedule client matching job to run periodically
 * This is a simple implementation - in production, you might want to use
 * a proper job queue like Bull, Agenda, or similar
 * 
 * @param intervalMs - Interval in milliseconds between job runs
 * @param config - Job configuration options
 * @returns Function to stop the scheduled job
 */
export function scheduleClientMatchingJob(
  intervalMs: number = 60000, // Default: 1 minute
  config: ClientMatchingJobConfig = {}
): () => void {
  console.log(`Scheduling client matching job to run every ${intervalMs}ms`)
  
  const intervalId = setInterval(async () => {
    try {
      await runClientMatchingJob(config)
    } catch (error) {
      console.error('Error in scheduled client matching job:', error)
    }
  }, intervalMs)

  // Return function to stop the scheduled job
  return () => {
    console.log('Stopping scheduled client matching job')
    clearInterval(intervalId)
  }
}

/**
 * Run client matching for a specific contact
 * Useful for webhook handlers or real-time processing
 * 
 * @param contactId - ID of the contact to match
 * @returns true if match found and updated, false otherwise
 */
export async function matchSingleContact(contactId: string): Promise<boolean> {
  try {
    console.log(`Running client matching for contact ${contactId}`)
    
    const whatsappService = getWhatsAppService()
    const matched = await whatsappService.matchSpecificContact(contactId)
    
    if (matched) {
      console.log(`Successfully matched contact ${contactId} with client`)
    } else {
      console.log(`No matching client found for contact ${contactId}`)
    }
    
    return matched
  } catch (error) {
    console.error(`Error matching contact ${contactId}:`, error)
    return false
  }
}

/**
 * Get client matching statistics
 * Useful for monitoring and reporting
 * 
 * @param instanceId - Optional instance ID to filter by
 * @returns Statistics about client matching
 */
export async function getClientMatchingStats(instanceId?: string): Promise<{
  totalContacts: number
  matchedContacts: number
  unmatchedContacts: number
  matchingPercentage: number
}> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get total contacts
    let totalQuery = supabase
      .from('whatsapp_contacts')
      .select('id', { count: 'exact' })

    if (instanceId) {
      totalQuery = totalQuery.eq('instance_id', instanceId)
    }

    const { count: totalCount } = await totalQuery

    // Get unmatched contacts
    let unmatchedQuery = supabase
      .from('whatsapp_contacts')
      .select('id', { count: 'exact' })
      .is('client_id', null)

    if (instanceId) {
      unmatchedQuery = unmatchedQuery.eq('instance_id', instanceId)
    }

    const { count: unmatchedCount } = await unmatchedQuery

    const total = totalCount || 0
    const unmatched = unmatchedCount || 0
    const matched = total - unmatched
    const percentage = total > 0 ? Math.round((matched / total) * 100) : 0

    return {
      totalContacts: total,
      matchedContacts: matched,
      unmatchedContacts: unmatched,
      matchingPercentage: percentage
    }
  } catch (error) {
    console.error('Error getting client matching stats:', error)
    return {
      totalContacts: 0,
      matchedContacts: 0,
      unmatchedContacts: 0,
      matchingPercentage: 0
    }
  }
}

// Export default job runner for easy import
export default runClientMatchingJob