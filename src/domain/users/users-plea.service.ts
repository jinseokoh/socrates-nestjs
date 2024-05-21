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

  async findByIds(senderId: number, recipientId: number): Promise<Plea[]> {
    try {
      return await this.pleaRepository.find({
        where: { senderId, recipientId },
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
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: userId,
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
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: myId,
        recipientId: userId,
      })
      .getMany();

    return items;
  }

  //--------------------------------------------------------------------------//

  async getMyReceivedPleas(myId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        recipientId: myId,
      })
      .groupBy('plea.senderId')
      .getMany();

    return items;
  }

  async getMySentPleas(myId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .where({
        senderId: myId,
      })
      .groupBy('plea.recipientId')
      .getMany();

    return items;
  }

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  async deletePleas(senderId: number, recipientId: number): Promise<void> {
    const pleas = await this.findByIds(senderId, recipientId);
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
      .groupBy('plea.senderId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
