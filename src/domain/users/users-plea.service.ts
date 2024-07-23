import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';

@Injectable()
export class UsersPleaService {
  private readonly logger = new Logger(UsersPleaService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
  ) {}

  //? ------------------------------------------------------------------------//
  //? Plea Pivot
  //? ------------------------------------------------------------------------//

  //--------------------------------------------------------------------------//
  // Read
  //--------------------------------------------------------------------------//

  async findByIds(userId: number, recipientId: number): Promise<Plea[]> {
    try {
      return await this.pleaRepository.find({
        where: { userId, recipientId },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //--------------------------------------------------------------------------//

  async getMyReceivedPleasFromThisUser(
    myId: number,
    userId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .innerJoinAndSelect('plea.poll', 'poll')
      .where({
        userId: userId,
        recipientId: myId,
      })
      .getMany();

    return items;
  }

  async getMySentPleasToThisUser(
    myId: number,
    userId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .innerJoinAndSelect('plea.poll', 'poll')
      .where({
        userId: myId,
        recipientId: userId,
      })
      .getMany();

    return items;
  }

  //--------------------------------------------------------------------------//

  async getReceivedPleasByUserId(userId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.poll', 'poll')
      .innerJoinAndSelect('plea.sender', 'sender')
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

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  async deletePleas(userId: number, recipientId: number): Promise<void> {
    const pleas = await this.findByIds(userId, recipientId);
    console.log('to be deleted => ', pleas);
    await Promise.all(
      pleas.map(async (v: Plea) => await this.pleaRepository.softDelete(v.id)),
    );
  }

  //--------------------------------------------------------------------------//

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        recipientId: userId,
      })
      .groupBy('plea.userId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
