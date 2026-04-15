import type {IBookingRepository} from "@repo/IBookingRepository"
import {Booking} from "@entity/Booking"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import {BookingStatus, type BookingFilter} from "@type/booking"
import type {ReviewDTO} from "@entity/ReviewDTO"
import sql from "../lib/postgres"

export class PgBookingRepository implements IBookingRepository {

  async findById(id: string): Promise<Booking | undefined> {
    const rows = await sql`
      SELECT
        b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
        b."ActivityID", b."ServiceType", b."Status",
        b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
        b."EstimatedCost", b."Currency", b."CreatedDate",
        r."ReviewID", r."Rating", r."Comment", r."ReviewType",
        r."CreatedDate" as "r_CreatedDate"
      FROM "BOOKING" b
      LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
      WHERE b."BookingID" = ${id}
    `
    if (rows.length === 0) return undefined
    return this.reconstruct(rows[0])
  }

  async findByOwnerId(adultChildId: UUID, filter?: BookingFilter): Promise<Booking[]> {
    let rows

    if (filter?.status && filter?.upcoming) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."AdultChildID" = ${adultChildId.toString()}
          AND b."Status" = ${filter.status}
          AND b."StartDateTime" > NOW()
        ORDER BY b."StartDateTime" ASC
      `
    } else if (filter?.status) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."AdultChildID" = ${adultChildId.toString()}
          AND b."Status" = ${filter.status}
      `
    } else if (filter?.upcoming) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."AdultChildID" = ${adultChildId.toString()}
          AND b."StartDateTime" > NOW()
        ORDER BY b."StartDateTime" ASC
      `
    } else {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."AdultChildID" = ${adultChildId.toString()}
      `
    }

    return rows.map((row: any) => this.reconstruct(row))
  }

  async findByCaretakerId(caretakerId: UUID, filter?: BookingFilter): Promise<Booking[]> {
    let rows

    if (filter?.status && filter?.upcoming) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."CaretakerID" = ${caretakerId.toString()}
          AND b."Status" = ${filter.status}
          AND b."StartDateTime" > NOW()
        ORDER BY b."StartDateTime" ASC
      `
    } else if (filter?.status) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."CaretakerID" = ${caretakerId.toString()}
          AND b."Status" = ${filter.status}
      `
    } else if (filter?.upcoming) {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."CaretakerID" = ${caretakerId.toString()}
          AND b."StartDateTime" > NOW()
        ORDER BY b."StartDateTime" ASC
      `
    } else {
      rows = await sql`
        SELECT
          b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
          b."ActivityID", b."ServiceType", b."Status",
          b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
          b."EstimatedCost", b."Currency", b."CreatedDate",
          r."ReviewID", r."Rating", r."Comment", r."ReviewType",
          r."CreatedDate" as "r_CreatedDate"
        FROM "BOOKING" b
        LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
        WHERE b."CaretakerID" = ${caretakerId.toString()}
      `
    }

    return rows.map((row: any) => this.reconstruct(row))
  }

  async findByActivityId(activityId: string): Promise<Booking[]> {
    const rows = await sql`
      SELECT
        b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
        b."ActivityID", b."ServiceType", b."Status",
        b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
        b."EstimatedCost", b."Currency", b."CreatedDate",
        r."ReviewID", r."Rating", r."Comment", r."ReviewType",
        r."CreatedDate" as "r_CreatedDate"
      FROM "BOOKING" b
      LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
      WHERE b."ActivityID" = ${activityId}
    `
    return rows.map((row: any) => this.reconstruct(row))
  }

  async findBySeniorId(seniorId: UUID): Promise<Booking[]> {
    const rows = await sql`
      SELECT
        b."BookingID", b."AdultChildID", b."CaretakerID", b."SeniorID",
        b."ActivityID", b."ServiceType", b."Status",
        b."StartDateTime", b."EndDateTime", b."Location", b."Notes",
        b."EstimatedCost", b."Currency", b."CreatedDate",
        r."ReviewID", r."Rating", r."Comment", r."ReviewType",
        r."CreatedDate" as "r_CreatedDate"
      FROM "BOOKING" b
      LEFT JOIN "REVIEW" r ON b."BookingID" = r."BookingID"
      WHERE b."SeniorID" = ${seniorId.toString()}
    `
    return rows.map((row: any) => this.reconstruct(row))
  }

  async insert(booking: Booking): Promise<string> {
    const shortId = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
    const bookingId = `BK-${shortId}`
    const dto = booking.toDTO()

    await sql`
      INSERT INTO "BOOKING" (
        "BookingID", "AdultChildID", "CaretakerID", "SeniorID", "ActivityID",
        "ServiceType", "Status", "StartDateTime", "EndDateTime",
        "Location", "Notes", "EstimatedCost", "Currency", "CreatedDate"
      ) VALUES (
        ${bookingId}, ${dto.adultChildId}, ${dto.caretakerId}, ${dto.seniorId},
        ${dto.activityId ?? null}, ${dto.serviceType}, ${dto.status},
        ${dto.startDate}, ${dto.endDate}, ${dto.location}, ${dto.note},
        ${dto.estimatedCost}, ${dto.currency}, ${new Date(dto.createdAt.getTime()).toISOString()}
      )
    `

    return bookingId
  }

  async save(booking: Booking): Promise<boolean> {
    const dto = booking.toDTO()
    if (!dto.id) return false
    const bookingId = dto.id

    await sql.begin(async (tx) => {
      await tx`
        UPDATE "BOOKING" SET
          "AdultChildID" = ${dto.adultChildId},
          "CaretakerID" = ${dto.caretakerId},
          "SeniorID" = ${dto.seniorId},
          "ActivityID" = ${dto.activityId ?? null},
          "ServiceType" = ${dto.serviceType},
          "Status" = ${dto.status},
          "StartDateTime" = ${dto.startDate},
          "EndDateTime" = ${dto.endDate},
          "Location" = ${dto.location},
          "Notes" = ${dto.note},
          "EstimatedCost" = ${dto.estimatedCost},
          "Currency" = ${dto.currency}
        WHERE "BookingID" = ${bookingId}
      `

      if (dto.review) {
        await tx`
          INSERT INTO "REVIEW" (
            "ReviewID", "BookingID", "Rating", "Comment", "ReviewType", "CreatedDate"
          ) VALUES (
            ${crypto.randomUUID()}, ${bookingId}, ${dto.review.rating},
            ${dto.review.comment}, ${dto.review.reviewType},
            ${new Date(dto.review.createdAt).toISOString()}
          )
          ON CONFLICT ("BookingID") DO UPDATE SET
            "Rating" = ${dto.review.rating},
            "Comment" = ${dto.review.comment},
            "ReviewType" = ${dto.review.reviewType},
            "CreatedDate" = ${new Date(dto.review.createdAt).toISOString()}
        `
      }
    })

    return true
  }

  async delete(booking: Booking): Promise<void> {
    const dto = booking.toDTO()
    await sql`
      DELETE FROM "BOOKING" WHERE "BookingID" = ${dto.id ?? ''}
    `
  }

  private reconstruct(row: any): Booking {
    let review: ReviewDTO | null = null
    if (row.ReviewID) {
      review = {
        rating: row.Rating,
        comment: row.Comment,
        reviewType: row.ReviewType,
        createdAt: new Date(row.r_CreatedDate).getTime(),
      }
    }
    return new Booking({
      id: row.BookingID,
      adultChildId: row.AdultChildID,
      seniorId: row.SeniorID,
      caretakerId: row.CaretakerID,
      serviceType: row.ServiceType,
      status: row.Status,
      startDate: row.StartDateTime?.toISOString() ?? "",
      endDate: row.EndDateTime?.toISOString() ?? "",
      location: row.Location ?? "",
      note: row.Notes ?? "",
      estimatedCost: Number(row.EstimatedCost) || 0,
      currency: row.Currency ?? "THB",
      review,
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
      activityId: row.ActivityID ?? null,
    })
  }
}
