import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';

@Injectable()
export class UserPleasService {
  private readonly logger = new Logger(UserPleasService.name);

  constructor(
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Read
  //? ----------------------------------------------------------------------- //

  async findByIds(userId: number, recipientId: number): Promise<Plea[]> {
    try {
      return await this.pleaRepository.find({
        where: { userId, recipientId },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // ------------------------------------------------------------------------ //

  async getMyReceivedPleasFromThisUser(
    userId: number,
    recipientId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.user', 'user')
      .innerJoinAndSelect('plea.poll', 'poll')
      .where({
        userId: recipientId,
        recipientId: userId,
      })
      .getMany();

    return items;
  }

  async getMySentPleasToThisUser(
    userId: number,
    recipientId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .innerJoinAndSelect('plea.poll', 'poll')
      .where({
        userId: userId,
        recipientId: recipientId,
      })
      .getMany();

    return items;
  }

  // ------------------------------------------------------------------------ //

  async getReceivedPleasByUserId(userId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.poll', 'poll')
      .innerJoinAndSelect('plea.user', 'user')
      .where({
        recipientId: userId,
      })
      .groupBy('plea.userId')
      .getMany();

    return items;
  }

  async getSentPleasByUserId(userId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.poll', 'poll')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .where({
        userId: userId,
      })
      .groupBy('plea.recipientId')
      .getMany();

    return items;
  }

  // ------------------------------------------------------------------------ //
  // Delete
  // ------------------------------------------------------------------------ //

  // todo. delete at once. don't run in loop.
  async deletePleas(userId: number, recipientId: number): Promise<void> {
    const pleas = await this.findByIds(userId, recipientId);
    await Promise.all(
      pleas.map(async (v: Plea) => await this.pleaRepository.delete(v.id)),
    );
  }

  // ------------------------------------------------------------------------ //

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.user', 'user')
      .where({
        recipientId: userId,
      })
      .groupBy('plea.userId')
      .getMany();

    return items.map((v) => v.user);
  }
}
