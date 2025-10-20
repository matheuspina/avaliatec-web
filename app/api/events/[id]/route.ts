import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Individual Event Operations
 * 
 * GET /api/events/[id] - Get event details
 * PUT /api/events/[id] - Update event
 * DELETE /api/events/[id] - Delete event
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'agenda', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(user_id)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
        return NextResponse.json(
          { error: 'Event not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: event
      })
    } catch (error) {
      console.error('Error in GET /api/events/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'agenda', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()
      const body = await request.json()

      // Update event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .update({
          title: body.title,
          description: body.description,
          start_date: body.start_date,
          end_date: body.end_date,
          location: body.location
        })
        .eq('id', id)
        .select()
        .single()

      if (eventError) {
        console.error('Error updating event:', eventError)
        return NextResponse.json(
          { error: 'Failed to update event', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      // Update participants if provided
      if (body.participants) {
        // Delete existing participants
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', id)

        // Add new participants
        const participantRecords = body.participants.map((participantId: string) => ({
          event_id: id,
          user_id: participantId
        }))

        await supabase
          .from('event_participants')
          .insert(participantRecords)
      }

      return NextResponse.json({
        success: true,
        data: event,
        message: 'Event updated successfully'
      })
    } catch (error) {
      console.error('Error in PUT /api/events/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'agenda', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Delete event (participants will be cascade deleted)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting event:', error)
        return NextResponse.json(
          { error: 'Failed to delete event', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Event deleted successfully'
      })
    } catch (error) {
      console.error('Error in DELETE /api/events/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
