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