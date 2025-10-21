/**
 * Client Matching Background Job API
 * 
 * This endpoint provides functionality to run the client matching background job
 * manually or via scheduled tasks/cron jobs.
 * 
 * Requirements covered:
 * - 7.1: Verify client with matching phone
 * - 7.2: Associate contact with client
 * - 7.6: Normalize phone numbers
 * - 8.3: Update contact type when matched
 */

import { NextRequest, NextResponse } from 'next/server'
import { runClientMatchingJob, getClientMatchingStats } from '@/lib/services/clientMatchingJob'

/**
 * POST /api/whatsapp/jobs/match-clients
 * 
 * Runs the client matching background job
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key or cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    // Allow access with either Bearer token or cron secret
    const isAuthorized = authHeader?.startsWith('Bearer ') || 
                        (cronSecret && cronSecret === process.env.CRON_SECRET)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide Bearer token or valid cron secret.' },
        { status: 401 }
      )
    }

    // Parse request body for job configuration
    const body = await request.json().catch(() => ({}))
    const {
      instanceId,
      batchSize = 10,
      delayBetweenBatches = 100,
      maxRetries = 3
    } = body

    console.log('Starting client matching job via API...', {
      instanceId: instanceId || 'all',
      batchSize,
      delayBetweenBatches,
      maxRetries
    })

    // Run the client matching job
    const result = await runClientMatchingJob({
      instanceId,
      batchSize,
      delayBetweenBatches,
      maxRetries
    })

    // Return job result
    return NextResponse.json({
      success: result.success,
      matchedCount: result.matchedCount,
      totalProcessed: result.totalProcessed,
      executionTime: result.executionTime,
      errors: result.errors,
      message: result.success 
        ? `Successfully matched ${result.matchedCount} contacts with clients`
        : 'Client matching job failed'
    }, {
      status: result.success ? 200 : 500
    })

  } catch (error) {
    console.error('Error running client matching job via API:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to run client matching job'
    }, { status: 500 })
  }
}

/**
 * GET /api/whatsapp/jobs/match-clients
 * 
 * Gets client matching statistics and job status
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key or allow public access for stats
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    // Allow access with either Bearer token, cron secret, or public access
    const isAuthorized = authHeader?.startsWith('Bearer ') || 
                        (cronSecret && cronSecret === process.env.CRON_SECRET) ||
                        process.env.NODE_ENV === 'development'
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')

    // Get client matching statistics
    const stats = await getClientMatchingStats(instanceId || undefined)

    return NextResponse.json({
      success: true,
      statistics: stats,
      message: 'Client matching statistics retrieved successfully'
    })

  } catch (error) {
    console.error('Error getting client matching statistics:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}