/**
 * Availability Checker Utility
 * 
 * This utility provides functions to check if the current time falls within
 * configured availability schedules for WhatsApp instances.
 * 
 * Requirements covered:
 * - 9.4: Check availability schedule when message is received
 * - 9.5: Respect availability hours for auto-reply functionality
 */

import { AvailabilitySchedule } from '@/lib/types'

/**
 * Days of the week mapping
 */
const DAYS_OF_WEEK = [
  'sunday',
  'monday', 
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const

type DayOfWeek = typeof DAYS_OF_WEEK[number]

/**
 * Check if current time is within availability schedule
 * 
 * @param schedule - The availability schedule configuration
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if currently available, false otherwise
 */
export function isWithinAvailability(
  schedule: AvailabilitySchedule,
  currentTime?: Date
): boolean {
  const now = currentTime || new Date()
  const dayOfWeek = DAYS_OF_WEEK[now.getDay()]
  
  // Get schedule for current day
  const daySchedule = schedule[dayOfWeek]
  
  // If no schedule for this day or day is disabled, not available
  if (!daySchedule || !daySchedule.enabled) {
    return false
  }
  
  // Parse start and end times
  const startTime = parseTimeString(daySchedule.start)
  const endTime = parseTimeString(daySchedule.end)
  
  if (!startTime || !endTime) {
    return false
  }
  
  // Get current time in minutes since midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // Handle same-day schedule
  if (endTime >= startTime) {
    return currentMinutes >= startTime && currentMinutes <= endTime
  }
  
  // Handle overnight schedule (e.g., 22:00 to 06:00)
  return currentMinutes >= startTime || currentMinutes <= endTime
}

/**
 * Get the next available time based on schedule
 * 
 * @param schedule - The availability schedule configuration
 * @param currentTime - Optional current time (defaults to now)
 * @returns Date of next availability or null if no schedule found
 */
export function getNextAvailableTime(
  schedule: AvailabilitySchedule,
  currentTime?: Date
): Date | null {
  const now = currentTime || new Date()
  
  // Check next 7 days for availability
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + dayOffset)
    
    const dayOfWeek = DAYS_OF_WEEK[checkDate.getDay()]
    const daySchedule = schedule[dayOfWeek]
    
    if (!daySchedule || !daySchedule.enabled) {
      continue
    }
    
    const startTime = parseTimeString(daySchedule.start)
    if (!startTime) {
      continue
    }
    
    // For today, check if start time is in the future
    if (dayOffset === 0) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      // If we're already past start time today, skip to next day
      if (currentMinutes >= startTime) {
        continue
      }
    }
    
    // Create next available datetime
    const nextAvailable = new Date(checkDate)
    nextAvailable.setHours(Math.floor(startTime / 60))
    nextAvailable.setMinutes(startTime % 60)
    nextAvailable.setSeconds(0)
    nextAvailable.setMilliseconds(0)
    
    return nextAvailable
  }
  
  return null
}

/**
 * Check if a specific time is within availability
 * 
 * @param schedule - The availability schedule configuration
 * @param checkTime - The time to check
 * @returns true if time is within availability, false otherwise
 */
export function isTimeWithinAvailability(
  schedule: AvailabilitySchedule,
  checkTime: Date
): boolean {
  return isWithinAvailability(schedule, checkTime)
}

/**
 * Get availability status for current time
 * 
 * @param schedule - The availability schedule configuration
 * @param currentTime - Optional current time (defaults to now)
 * @returns Object with availability status and next available time
 */
export function getAvailabilityStatus(
  schedule: AvailabilitySchedule,
  currentTime?: Date
): {
  isAvailable: boolean
  nextAvailableTime: Date | null
  currentDay: DayOfWeek
  message: string
} {
  const now = currentTime || new Date()
  const isAvailable = isWithinAvailability(schedule, now)
  const nextAvailableTime = isAvailable ? null : getNextAvailableTime(schedule, now)
  const currentDay = DAYS_OF_WEEK[now.getDay()]
  
  let message: string
  if (isAvailable) {
    message = 'Currently available'
  } else if (nextAvailableTime) {
    message = `Next available: ${formatDateTime(nextAvailableTime)}`
  } else {
    message = 'No availability scheduled'
  }
  
  return {
    isAvailable,
    nextAvailableTime,
    currentDay,
    message
  }
}

/**
 * Parse time string in HH:mm format to minutes since midnight
 * 
 * @param timeString - Time in HH:mm format
 * @returns Minutes since midnight or null if invalid
 */
function parseTimeString(timeString: string): number | null {
  if (!timeString || typeof timeString !== 'string') {
    return null
  }
  
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) {
    return null
  }
  
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  
  return hours * 60 + minutes
}

/**
 * Format date and time for display
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Validate availability schedule format
 * 
 * @param schedule - Schedule to validate
 * @returns true if valid, false otherwise
 */
export function validateAvailabilitySchedule(schedule: AvailabilitySchedule): boolean {
  if (!schedule || typeof schedule !== 'object') {
    return false
  }
  
  for (const day of DAYS_OF_WEEK) {
    const daySchedule = schedule[day]
    
    if (daySchedule) {
      // Check required properties
      if (typeof daySchedule.enabled !== 'boolean') {
        return false
      }
      
      if (daySchedule.enabled) {
        // Validate time format if enabled
        if (!daySchedule.start || !daySchedule.end) {
          return false
        }
        
        const startTime = parseTimeString(daySchedule.start)
        const endTime = parseTimeString(daySchedule.end)
        
        if (startTime === null || endTime === null) {
          return false
        }
      }
    }
  }
  
  return true
}

/**
 * Create a default availability schedule (Monday to Friday, 8:00 to 18:00)
 * 
 * @returns Default availability schedule
 */
export function createDefaultAvailabilitySchedule(): AvailabilitySchedule {
  return {
    sunday: { enabled: false, start: '08:00', end: '18:00' },
    monday: { enabled: true, start: '08:00', end: '18:00' },
    tuesday: { enabled: true, start: '08:00', end: '18:00' },
    wednesday: { enabled: true, start: '08:00', end: '18:00' },
    thursday: { enabled: true, start: '08:00', end: '18:00' },
    friday: { enabled: true, start: '08:00', end: '18:00' },
    saturday: { enabled: false, start: '08:00', end: '18:00' }
  }
}