import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { DotsService } from 'src/domain/dots/dots.service';
import { Dot } from 'src/domain/dots/entities/dot.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('dots')
export class DotsController {
  constructor(private readonly dotsService: DotsService) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Dot List' })
  @Get()
  async getDots(): Promise<Array<Dot>> {
    return await this.dotsService.getAll();
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed dots' })
  @Post('seed')
  async seedDots(): Promise<void> {
    return await this.dotsService.seedDots();
  }
}
