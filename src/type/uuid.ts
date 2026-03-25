export class UUID  extends String{
  is(uuid: UUID | undefined) {
    return uuid !== undefined && uuid.toString() === this.toString()
  }
}