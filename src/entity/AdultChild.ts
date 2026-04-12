import type {AdultChildAttributes} from "@entity/UserDTO"

export class AdultChild {
  private phone: string
  private relationship: string
  private goal: string
  private concerns: string[]

  constructor(attr: AdultChildAttributes)
  constructor(phone: string, relationship: string, goal: string, concerns: string[])

  constructor(...args: [AdultChildAttributes] | [string, string, string, string[]]) {
    if (typeof args[0] === "object" && "phone" in args[0]) {
      const attr = args[0] as AdultChildAttributes
      this.phone = attr.phone
      this.relationship = attr.relationship
      this.goal = attr.goal
      this.concerns = attr.concerns
      return
    }

    const arr = args as [string, string, string, string[]]
    this.phone = arr[0]
    this.relationship = arr[1]
    this.goal = arr[2]
    this.concerns = arr[3]
  }

  public toDTO(): AdultChildAttributes {
    return {
      phone: this.phone,
      relationship: this.relationship,
      goal: this.goal,
      concerns: this.concerns,
    }
  }

  public setProfile(data: Partial<AdultChildAttributes>) {
    if (data.phone !== undefined) this.phone = data.phone
    if (data.relationship !== undefined) this.relationship = data.relationship
    if (data.goal !== undefined) this.goal = data.goal
    if (data.concerns !== undefined) this.concerns = data.concerns
  }
}
