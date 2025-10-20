import { createClient } from "../supabase/client"

export type CalendarEvent = {
  id: string
  title: string
  description: string
  date: Date
  time: string // HH:mm
  location: string
  type: "meeting" | "deadline" | "visit"
  client?: { id: string; name: string }
  participants?: string[] // Array of user IDs
}

function toISODateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeTime(t?: string | null): string {
  if (!t) return "00:00"
  // Expect formats like HH:mm or HH:mm:ss; return HH:mm
  const parts = t.split(":")
  if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`
  return t
}

export async function listEventsByDate(date: Date): Promise<CalendarEvent[]> {
  const supabase = createClient()
  const iso = toISODateString(date)
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, event_date, event_time, location, type, client_id, clients(id, name)"
    )
    .eq("event_date", iso)
    .order("event_time", { ascending: true })

  if (error) throw error

  // Fetch participants for all events
  const eventIds = (data ?? []).map((e: any) => e.id)
  const { data: participantsData } = await supabase
    .from("event_participants")
    .select("event_id, user_id")
    .in("event_id", eventIds)

  const participantsMap = new Map<string, string[]>()
  ;(participantsData ?? []).forEach((p: any) => {
    if (!participantsMap.has(p.event_id)) {
      participantsMap.set(p.event_id, [])
    }
    participantsMap.get(p.event_id)!.push(p.user_id)
  })

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    date: new Date(r.event_date),
    time: normalizeTime(r.event_time),
    location: r.location ?? "",
    type: r.type as CalendarEvent["type"],
    client: r.clients ? { id: r.clients.id, name: r.clients.name } : undefined,
    participants: participantsMap.get(r.id) ?? [],
  }))
}

export async function createEvent(input: {
  title: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  type: "meeting" | "deadline" | "visit"
  client_id?: string | null
  project_id?: string | null
  participants?: string[] // Array of user IDs
}): Promise<string> {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id ?? null

  const payload: any = {
    title: input.title,
    description: input.description,
    event_date: input.date,
    event_time: input.time,
    location: input.location,
    type: input.type,
    client_id: input.client_id ?? null,
    project_id: input.project_id ?? null,
    created_by: userId,
  }

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single()

  if (error) throw error
  
  const eventId = data?.id as string
  
  // Add participants
  const participants = input.participants ?? []
  if (userId && !participants.includes(userId)) {
    participants.push(userId)
  }
  
  if (participants.length > 0) {
    const participantRecords = participants.map(uid => ({
      event_id: eventId,
      user_id: uid,
    }))
    
    const { error: participantsError } = await supabase
      .from("event_participants")
      .insert(participantRecords)
    
    if (participantsError) {
      console.error("Error adding participants:", participantsError)
    }
  }
  
  return eventId
}

export async function updateEvent(id: string, changes: Partial<{
  title: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  type: "meeting" | "deadline" | "visit"
  client_id: string | null
  project_id: string | null
  participants: string[]
}>): Promise<void> {
  const supabase = createClient()
  const payload: any = { ...changes }
  
  // Handle participants separately
  const participants = payload.participants
  delete payload.participants
  
  if ("date" in payload) {
    payload.event_date = payload.date
    delete payload.date
  }
  if ("time" in payload) {
    payload.event_time = payload.time
    delete payload.time
  }
  const { error } = await supabase.from("events").update(payload).eq("id", id)
  if (error) throw error
  
  // Update participants if provided
  if (participants !== undefined) {
    await updateEventParticipants(id, participants)
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) throw error
}

export async function addEventParticipant(eventId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, user_id: userId })
  if (error && error.code !== '23505') { // Ignore unique constraint violations
    throw error
  }
}

export async function removeEventParticipant(eventId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function updateEventParticipants(eventId: string, participants: string[]): Promise<void> {
  const supabase = createClient()
  
  // Delete all existing participants
  await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
  
  // Add new participants
  if (participants.length > 0) {
    const participantRecords = participants.map(uid => ({
      event_id: eventId,
      user_id: uid,
    }))
    
    const { error } = await supabase
      .from("event_participants")
      .insert(participantRecords)
    
    if (error) throw error
  }
}

export async function getEventParticipants(eventId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", eventId)
  
  if (error) throw error
  return (data ?? []).map((p: any) => p.user_id)
}