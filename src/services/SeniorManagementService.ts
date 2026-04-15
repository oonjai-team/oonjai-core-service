import type {ISeniorRepository} from "@repo/ISeniorRepository"
import type {IUserRepository} from "@repo/IUserRepository"
import type {UUID} from "@type/uuid"
import {Senior} from "../entity/Senior"
import {TimestampHelper} from "../type/timestamp"
import type {IService} from "@serv/IService"

export class SeniorManagementService implements IService {
  private seniorRepo: ISeniorRepository
  private userRepo: IUserRepository

  constructor(userRepo: IUserRepository, seniorRepo: ISeniorRepository) {
    this.seniorRepo = seniorRepo
    this.userRepo = userRepo
  }

  public getServiceId(): string {
    return "SeniorManagementService"
  }

  public async addSeniorToAdultChild(adultChildId: UUID, fullname: string, dateOfBirth: string, mobilityLevel: string, healthNote: string): Promise<Senior> {
    const user = await this.userRepo.findById(adultChildId)
    if (!user) {
      throw new Error("adult child not found")
    }

    const senior = new Senior(adultChildId, fullname, dateOfBirth, mobilityLevel, healthNote, TimestampHelper.now())
    const id = await this.seniorRepo.insert(senior)
    return new Senior(adultChildId, fullname, dateOfBirth, mobilityLevel, healthNote, senior.toDTO().createdAt, id)
  }

  public async removeSeniorFromAdultChild(adultChildId: UUID, seniorId: UUID): Promise<void> {
    const senior = await this.seniorRepo.findById(seniorId)
    if (!senior) {
      throw new Error("senior not found")
    }

    if (senior.toDTO().adultChildId.toString() !== adultChildId.toString()) {
      throw new Error("senior does not belong to this adult child")
    }

    await this.seniorRepo.delete(senior)
  }

  public async getAllSeniorsFromUser(adultChildId: UUID): Promise<Senior[]> {
    const user = await this.userRepo.findById(adultChildId)
    if (!user) {
      throw new Error("adult child not found")
    }

    return this.seniorRepo.findAllByAdultChildId(adultChildId)
  }

  public async getSeniorById(adultChildId: UUID, seniorId: UUID): Promise<Senior | undefined> {
    const senior = await this.seniorRepo.findById(seniorId)
    if (!senior) {
      return undefined
    }

    if (senior.toDTO().adultChildId.toString() !== adultChildId.toString()) {
      return undefined
    }

    return senior
  }
}
