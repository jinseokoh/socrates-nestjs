import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { RegionsService } from 'src/domain/regions/regions.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'return all trees' })
  @Get('')
  async getAllRegions(): Promise<any> {
    return await this.regionsService.findAll();
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed regions' })
  @Post('seed')
  async region(): Promise<void> {
    return await this.regionsService.seedRegion();
  }
}
