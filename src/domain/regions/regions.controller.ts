import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
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

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.regionsService.findBySlug(slug);
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
