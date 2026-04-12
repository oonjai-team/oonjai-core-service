// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// Each value array contains start-hours (0-23) for available 1-hour slots.
// e.g. { "1": [9,10,11,12,13] } means Monday 09:00–14:00
export type WeeklyAvailability = Record<string, number[]>

/** Enumerate every 1-hour slot between start and end as { day, hour } pairs. */
export function enumerateHourSlots(start: Date, end: Date): { day: number; hour: number }[] {
  const slots: { day: number; hour: number }[] = []
  const cursor = new Date(start.getTime())
  while (cursor.getTime() < end.getTime()) {
    slots.push({ day: cursor.getDay(), hour: cursor.getHours() })
    cursor.setTime(cursor.getTime() + 60 * 60 * 1000)
  }
  return slots
}

export interface CaretakerFilter {
  serviceType: string
  startDate: Date
  endDate: Date
  specialization?: string
  minRating?: number
  minExperience?: number
  maxHourlyRate?: number
  sortBy?: "recommended" | "rating" | "experience" | "price_asc" | "price_desc"
}