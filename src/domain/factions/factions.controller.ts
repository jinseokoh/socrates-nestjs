import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FactionsService } from 'src/domain/factions/factions.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('factions')
export class FactionsController {
  constructor(private readonly factionsService: FactionsService) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':name')
  async getBySlug(@Param('name') name: string): Promise<any> {
    return await this.factionsService.findByName(name);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed factions' })
  @Post('seed')
  async faction(): Promise<void> {
    return await this.factionsService.seedFaction();
  }
}
