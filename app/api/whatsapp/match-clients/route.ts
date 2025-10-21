/**
 * WhatsApp Client Matching API Route
 * 
 * This endpoint provides functionality to run automatic client matching
 * for WhatsApp contacts, either for all contacts or specific instances.
 * 
 * Requirements covered:
 * - 7.1: Verify client with matching phone
 * - 7.2: Associate contact with client
 * - 7.6: Normalize phone numbers
 * - 8.3: Update contact type when matched
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppService } from '@/lib/services/whatsappService'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/whatsapp/match-clients
 * 
 * Runs automatic client matching for WhatsApp contacts
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { instanceId, contactId } = body

    const whatsappService = getWhatsAppService()

    if (contactId) {
      // Match specific contact
      const matched = await whatsappService.matchSpecificContact(contactId)
      
      return NextResponse.json({
        success: true,
        matched,
        message: matched 
          ? 'Contact successfully matched with client'
          : 'No matching client found for contact'
      })
    } else {
      // Run automatic matching for all unmatched contacts
      const matchedCount = await whatsappService.runAutomaticClientMatching(instanceId)
      
      return NextResponse.json({
        success: true,
        matchedCount,
        message: `Successfully matched ${matchedCount} contacts with clients`
      })
    }

  } catch (error) {
    console.error('Error in client matching API:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to run client matching'
    }, { status: 500 })
  }
}

/**
 * GET /api/whatsapp/match-clients
 * 
 * Gets statistics about unmatched contacts
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')

    // Build query for unmatched contacts
    let query = supabase
      .from('whatsapp_contacts')
      .select('id, instance_id, phone_number, name, contact_type', { count: 'exact' })
      .is('client_id', null)
      .not('phone_number', 'is', null)
      .not('phone_number', 'eq', '')

    if (instanceId) {
      query = query.eq('instance_id', instanceId)
    }

    const { data: unmatchedContacts, count, error } = await query

    if (error) {
      throw error
    }

    // Get total contacts count
    let totalQuery = supabase
      .from('whatsapp_contacts')
      .select('id', { count: 'exact' })

    if (instanceId) {
      totalQuery = totalQuery.eq('instance_id', instanceId)
    }

    const { count: totalCount, error: totalError } = await totalQuery

    if (totalError) {
      throw totalError
    }

    return NextResponse.json({
      success: true,
      statistics: {
        totalContacts: totalCount || 0,
        unmatchedContacts: count || 0,
        matchedContacts: (totalCount || 0) - (count || 0),
        matchingPercentage: totalCount ? Math.round(((totalCount - (count || 0)) / totalCount) * 100) : 0
      },
      unmatchedContacts: unmatchedContacts || []
    })

  } catch (error) {
    console.error('Error getting matching statistics:', error)
    
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