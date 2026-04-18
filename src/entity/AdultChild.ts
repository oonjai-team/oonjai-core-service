import type {AdultChildAttributes} from "@entity/UserDTO"

export class AdultChild {
  private relationship: string
  private goal: string
  private concerns: string[]

  constructor(attr: AdultChildAttributes)
  constructor(relationship: string, goal: string, concerns: string[])

  constructor(...args: [AdultChildAttributes] | [string, string, string[]]) {
    if (typeof args[0] === "object" && "relationship" in args[0]) {
      const attr = args[0] as AdultChildAttributes
      this.relationship = attr.relationship
      this.goal = attr.goal
      this.concerns = attr.concerns
      return
    }

    const arr = args as [string, string, string[]]
    this.relationship = arr[0]
    this.goal = arr[1]
    this.concerns = arr[2]
  }

  public toDTO(): AdultChildAttributes {
    return {
      relationship: this.relationship,
      goal: this.goal,
      concerns: this.concerns,
    }
  }

  public setProfile(data: Partial<AdultChildAttributes>) {
    if (data.relationship !== undefined) this.relationship = data.relationship
    if (data.goal !== undefined) this.goal = data.goal
    if (data.concerns !== undefined) this.concerns = data.concerns
  }
}
