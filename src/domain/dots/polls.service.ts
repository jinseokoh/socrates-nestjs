import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePollDto } from 'src/domain/dots/dto/create-poll.dto';
import { UpdatePollDto } from 'src/domain/dots/dto/update-poll.dto';
import { Poll } from 'src/domain/dots/entities/poll.entity';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    @InjectRepository(Poll)
    private readonly repository: Repository<Poll>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreatePollDto): Promise<Poll> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Poll 리스트
  async getAll(): Promise<Array<Poll>> {
    return await this.repository.find({
      relations: ['dot'],
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Poll> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // Poll 갱신
  async update(id: number, dto: UpdatePollDto): Promise<Poll> {
    const poll = await this.repository.preload({ id, ...dto });
    if (!poll) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(poll);
  }
}
