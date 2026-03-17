import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {RoleEnum} from "@type/user"

export interface UserDTO {
  id: UUID | undefined
  email: string
  firstname: string
  lastname: string
  createdAt: Timestamp
  role: RoleEnum
}