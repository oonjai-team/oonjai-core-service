// Concrete availability window declared by a caretaker.
// Maps 1:1 to a row in the Caretaker_Availability table.
export interface AvailabilitySlot {
  id?: string
  startDateTime: string // ISO timestamp
  endDateTime: string   // ISO timestamp
  isActive: boolean
  createdDate?: string
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
