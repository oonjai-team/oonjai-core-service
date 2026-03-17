export class Timestamp {

  private timeInMil: number
  constructor(date: Date)
  constructor(millisec: number)
  constructor(isoString: string)

  constructor(...args: (Date | number| string | {timeInMil: number})[]) {
    const farg = args[0]
    if (!farg) {
      throw new Error("Timestamp constructor requires a valid Date or number argument")
    }
    if (typeof farg === "string") {
      this.timeInMil = new Date(farg).getTime()
      return
    }

    if (typeof farg === "object" && "timeInMil" in farg) {
      this.timeInMil = farg.timeInMil
      return
    }

    this.timeInMil = typeof farg === 'number' ? farg : farg.getTime()
  }

  public getTime(): number {
    return this.timeInMil
  }

  public toString(): string {
    return this.getTime().toString(10)
  }
}

export class TimestampHelper {
  public static now() {
    return new Timestamp(new Date())
  }
}