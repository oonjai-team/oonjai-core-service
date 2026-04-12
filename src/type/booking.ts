export enum BookingStatus {
  CREATED   = "created",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ServiceType {
  MEDICAL_ESCORT = "medical_escort",
  HOME_CARE      = "home_care",
  OUTINGS        = "outings",
  ACTIVITY       = "activity",
}

export interface BookingFilter {
  status?: BookingStatus
  upcoming?: boolean
}
