import {PgUserRepository} from "@repo/PgUserRepository"
import {PgAvailabilityRepository} from "@repo/PgAvailabilityRepository"
import {PgSeniorRepository} from "@repo/PgSeniorRepository"
import {UserService} from "@serv/UserService"
import {SeniorManagementService} from "@serv/SeniorManagementService"
import {AuthService} from "@serv/AuthService"
import {JWTSessionService} from "@serv/JWTSessionService"
import {LineOauthService} from "@serv/oauth/LineOauthService"
import {Router} from "@http/Router"
import {EndpointRegistry} from "@http/EndpointRegistry"
import {serveBun} from "@http/BunAdapter"

import {updateUser} from "@endpoint/users/updateUser"
import {addSenior} from "@endpoint/seniors/addSenior"
import {getAllSeniors} from "@endpoint/seniors/getAllSeniors"
import {getSeniorById} from "@endpoint/seniors/getSeniorById"
import {deleteSenior} from "@endpoint/seniors/deleteSenior"
import {login} from "@endpoint/auth/login"
import {register} from "@endpoint/auth/register"
import {logout} from "@endpoint/auth/logout"
import {refreshToken} from "@endpoint/auth/refreshToken"
import {getCurrentSession} from "@endpoint/auth/getCurrentSession"
import {oauthLogin} from "@endpoint/auth/oauthLogin"
import {oauthCallback} from "@endpoint/auth/oauthCallback"
import {onboarding} from "@endpoint/auth/onboarding"
import {me} from "@endpoint/users/me"
import {getAvailableCaretakers} from "@endpoint/caretakers/getAvailableCaretakers"
import {getCaretakerById} from "@endpoint/caretakers/getCaretakerById"
import {updateCaretakerProfile} from "@endpoint/caretakers/updateCaretakerProfile"

import {PgStatusLogRepository} from "@repo/PgStatusLogRepository"
import {StatusLogService} from "@serv/StatusLogService"
import {getStatusLogs} from "@endpoint/statusLogs/getStatusLogs"
import {createStatusLog} from "@endpoint/statusLogs/createStatusLog"
import {MemoryOAuthStateRepository} from "@repo/MemoryOAuthStateRepository"
import {OAuthRegistry} from "@serv/oauth/OAuthRegistry"
import {GoogleOauthService} from "@serv/oauth/GoogleOauthService"

import {PgBookingRepository} from "@repo/PgBookingRepository"
import {BookingService} from "@serv/BookingService"

import {PgActivityRepository} from "@repo/PgActivityRepository"
import {ActivityService} from "@serv/ActivityService"
import {getActivities} from "@endpoint/activities/getActivities"
import {getActivityById} from "@endpoint/activities/getActivityById"
import {getBookedSeniors} from "@endpoint/activities/getBookedSeniors"
import {getSeniorConflicts} from "@endpoint/activities/getSeniorConflicts"
import {getActivityPrecautions, makePrecautionCacheRepoService} from "@endpoint/activities/getActivityPrecautions"
import {OllamaService} from "@serv/OllamaService"
import {PgPrecautionCacheRepository} from "@repo/PgPrecautionCacheRepository"
import {createActivityBooking} from "@endpoint/bookings/createActivityBooking"

import {PgIncidentLogRepository} from "@repo/PgIncidentLogRepository"
import {IncidentLogService} from "@serv/IncidentLogService"
import {getIncidentLogs} from "@endpoint/incidentLogs/getIncidentLogs"
import {createIncidentLog} from "@endpoint/incidentLogs/createIncidentLog"
import {updateIncidentLog} from "@endpoint/incidentLogs/updateIncidentLog"
import {getBookings} from "@endpoint/bookings/getBookings"
import {createBooking} from "@endpoint/bookings/createBooking"
import {getSeniorServiceConflicts} from "@endpoint/bookings/getSeniorServiceConflicts"
import {getBookingById} from "@endpoint/bookings/getBookingById"
import {updateBooking} from "@endpoint/bookings/updateBooking"
import {cancelBooking} from "@endpoint/bookings/cancelBooking"
import {confirmBooking} from "@endpoint/bookings/confirmBooking"
import {endSession} from "@endpoint/bookings/endSession"
import {submitReview} from "@endpoint/bookings/submitReview"

import {PgPaymentRepository} from "@repo/PgPaymentRepository"
import {PaymentService} from "@serv/PaymentService"
import {initiatePayment} from "@endpoint/payments/initiatePayment"
import {getPaymentStatus} from "@endpoint/payments/getPaymentStatus"
import {paymentWebhook} from "@endpoint/payments/paymentWebhook"
import {createCheckoutSession} from "@endpoint/payments/createCheckoutSession"
import {completeCheckout} from "@endpoint/payments/completeCheckout"
// Verification
import {PgVerificationRepository} from "@repo/PgVerificationRepository"
import {VerificationService} from "@serv/VerificationService"
import {createVerification} from "@endpoint/verifications/createVerification"
import {getPendingVerifications} from "@endpoint/verifications/getPendingVerifications"
import {updateVerification} from "@endpoint/verifications/updateVerification"

// ── Infrastructure (Postgres) ────────────────────────────────────────────────
const userRepo = new PgUserRepository()
const availabilityRepo = new PgAvailabilityRepository()
const seniorRepo = new PgSeniorRepository()
const statusLogRepo = new PgStatusLogRepository()
const bookingRepo = new PgBookingRepository()
const paymentRepo = new PgPaymentRepository()
const incidentLogRepo = new PgIncidentLogRepository()
const activityRepo = new PgActivityRepository()
const verificationRepo = new PgVerificationRepository()
const oauthStateRepo = new MemoryOAuthStateRepository()

// ── Services ──────────────────────────────────────────────────────────────────
const jwtSessionService = new JWTSessionService(userRepo, process.env["JWT_SECRET"] ?? "change-me-in-production")
const userService = new UserService(userRepo, availabilityRepo)
const seniorManagementService = new SeniorManagementService(userRepo, seniorRepo)
const bookingService = new BookingService(bookingRepo, userRepo, availabilityRepo)
const paymentService = new PaymentService(paymentRepo, bookingRepo)
const incidentLogService = new IncidentLogService(incidentLogRepo, bookingRepo)
const verificationService = new VerificationService(verificationRepo, userRepo)
const activityService = new ActivityService(activityRepo)
const ollamaService = new OllamaService(
  process.env["OLLAMA_URL"] ?? "https://ollama.com",
  process.env["OLLAMA_MODEL"] ?? "gpt-oss:20b",
  process.env["OLLAMA_API_KEY"] ?? ""
)
const precautionCacheRepo = new PgPrecautionCacheRepository()
const precautionCacheSvc = makePrecautionCacheRepoService(precautionCacheRepo)
const statusLogService = new StatusLogService(statusLogRepo)
const authService = new AuthService(userService, jwtSessionService)
const lineAuthService = new LineOauthService(
  process.env["LINE_CHANNEL_ID"] ?? "",
  process.env["LINE_CHANNEL_SECRET"] ?? "",
  oauthStateRepo
)

const googleAuthService = new GoogleOauthService(
  process.env["GOOGLE_CLIENT_ID"] ?? "",
  process.env["GOOGLE_CLIENT_SECRET"] ?? "",
  oauthStateRepo
)

// ── HTTP ──────────────────────────────────────────────────────────────────────
const router = new Router(jwtSessionService)
const registry = new EndpointRegistry(router)
const oauthReg = new OAuthRegistry(oauthStateRepo, [lineAuthService, googleAuthService])

console.log(oauthReg)
registry
// Auth
.register(login, [authService])
  .register(register, [authService])
  .register(logout, [authService])
  .register(refreshToken, [jwtSessionService])
  .register(getCurrentSession, [])   // no service — session entity comes from Router
  // LINE OAuth
  .register(oauthLogin, [oauthReg])
  .register(oauthCallback, [oauthReg, authService])
  .register(onboarding, [userService])
  .register(getCurrentSession, [])
  // Users
  .register(updateUser, [userService])
  .register(me, [userService])
  // Caretakers
  .register(getAvailableCaretakers, [userService])
  .register(getCaretakerById, [userService])
  .register(updateCaretakerProfile, [userService])
  // Seniors
  .register(addSenior, [seniorManagementService])
  .register(getAllSeniors, [seniorManagementService])
  .register(getSeniorById, [seniorManagementService])
  .register(deleteSenior, [seniorManagementService])
  // Status Logs
  .register(createStatusLog, [statusLogService])
  .register(getStatusLogs, [statusLogService])
  // Bookings
  .register(getBookings, [bookingService, userService, activityService])
  .register(createBooking, [bookingService])
  .register(getSeniorServiceConflicts, [bookingService, seniorManagementService])
  .register(getBookingById, [bookingService])
  .register(updateBooking, [bookingService])
  .register(cancelBooking, [bookingService])
  .register(confirmBooking, [bookingService])
  .register(endSession, [bookingService])
  .register(submitReview, [bookingService])
  // Payments
  .register(initiatePayment, [paymentService])
  .register(getPaymentStatus, [paymentService])
  .register(paymentWebhook, [paymentService])
  .register(createCheckoutSession, [paymentService])
  .register(completeCheckout, [paymentService])
  // Incident Logs
  .register(getIncidentLogs, [incidentLogService, bookingService])
  .register(createIncidentLog, [incidentLogService])
  .register(updateIncidentLog, [incidentLogService])
  .register(getSeniorById, [seniorManagementService])
  .register(deleteSenior, [seniorManagementService])
  // Activities
  .register(getActivities, [activityService])
  .register(getActivityById, [activityService])
  .register(getBookedSeniors, [bookingService])
  .register(getSeniorConflicts, [bookingService, activityService, seniorManagementService])
  .register(getActivityPrecautions, [activityService, seniorManagementService, ollamaService, precautionCacheSvc])
  // Activity Bookings
  .register(createActivityBooking, [bookingService, activityService])
  // Verifications
  .register(createVerification, [verificationService])
  .register(getPendingVerifications, [verificationService])
  .register(updateVerification, [verificationService])

const port = Number(process.env.PORT) || 3030
serveBun(router, {port})
