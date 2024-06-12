import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AnyData } from 'src/common/types';
import { Faction } from 'src/domain/factions/entities/faction.entity';

import { Repository } from 'typeorm';

@Injectable()
export class FactionsService {
  private readonly logger = new Logger(FactionsService.name);

  constructor(
    @InjectRepository(Faction)
    private readonly repository: Repository<Faction>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findByName(name: string): Promise<any> {
    return await this.repository.find({
      where: { name },
    });
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedFaction(): Promise<void> {
    await this.repository.manager.query(
      "INSERT INTO `faction` (`id`, `name`, `minAge`, `maxAge`) VALUES \
(1, '18,30', 18, 30), \
(2, '24,36', 24, 36), \
(3, '30,42', 30, 42), \
(4, '36,48', 36, 48), \
(5, '42,54', 42, 54), \
(6, '48,60', 48, 60), \
(7, '54,66', 54, 66);",
    );
  }
}
