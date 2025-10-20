import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Events Management
 * 
 * GET /api/events - List all events (filtered by RLS)
 * POST /api/events - Create new event
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'agenda', async (userId) => {
    try {
      const supabase = await createClient()

      // RLS policies will automatically filter events based on participants
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching events:', error)
        return NextResponse.json(
          { error: 'Failed to fetch events', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: events
      })
    } catch (error) {
      console.error('Error in GET /api/events:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'agenda', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.title || !body.start_date) {
        return NextResponse.json(
          { error: 'Event title and start date are required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: body.title,
          description: body.description,
          start_date: body.start_date,
          end_date: body.end_date,
          location: body.location,
          created_by: userId
        })
        .select()
        .single()

      if (eventError) {
        console.error('Error creating event:', eventError)
        return NextResponse.json(
          { error: 'Failed to create event', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      // Add participants including creator
      const participants = [userId, ...(body.participants || [])]
      const participantRecords = participants.map(participantId => ({
        event_id: event.id,
        user_id: participantId
      }))

      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert(participantRecords)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        // Event created but participants failed - log but don't fail
      }

      return NextResponse.json({
        success: true,
        data: event,
        message: 'Event created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/events:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
