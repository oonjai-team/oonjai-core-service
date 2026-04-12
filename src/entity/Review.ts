import type {ReviewDTO} from "@entity/ReviewDTO"

export class Review {
  private rating: number
  private comment: string
  private reviewType: string
  private createdAt: number

  constructor(dto: ReviewDTO)
  constructor(rating: number, comment: string, reviewType: string, createdAt: number)

  constructor(...args: [ReviewDTO] | [number, string, string, number]) {
    if (typeof args[0] === "object" && "rating" in args[0]) {
      const dto = args[0] as ReviewDTO
      this.rating = dto.rating
      this.comment = dto.comment
      this.reviewType = dto.reviewType
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [number, string, string, number]
    this.rating = arr[0]
    this.comment = arr[1]
    this.reviewType = arr[2]
    this.createdAt = arr[3]
  }

  public getRating(): number {
    return this.rating
  }

  public toDTO(): ReviewDTO {
    return {
      rating: this.rating,
      comment: this.comment,
      reviewType: this.reviewType,
      createdAt: this.createdAt,
    }
  }
}
