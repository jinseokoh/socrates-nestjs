import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { DotsService } from 'src/domain/connections/dots.service';
import { CreateDotDto } from 'src/domain/connections/dto/create-dot.dto';
import { UpdateDotDto } from 'src/domain/connections/dto/update-dot.dto';
import { Dot } from 'src/domain/connections/entities/dot.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('dots')
export class DotsController {
  constructor(private readonly dotsService: DotsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '커넥션 질문 추가' })
  @Post()
  async createConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreateDotDto,
  ): Promise<Dot> {
    try {
      return await this.dotsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Dot List' })
  @Get()
  async getAll(): Promise<Array<Dot>> {
    return await this.dotsService.getAll();
  }

  @Public()
  @ApiOperation({ description: 'Dot List' })
  @Get(':slug')
  async getBySlugs(@Param('slug') slug: string): Promise<Array<Dot>> {
    return await this.dotsService.getBySlug(slug);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateDotDto,
  ): Promise<any> {
    return await this.dotsService.update(id, dto);
  }

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id/up')
  async thumbsUp(@Param('id') id: number): Promise<any> {
    return await this.dotsService.thumbsUp(id);
  }

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id/down')
  async thumbsDown(@Param('id') id: number): Promise<any> {
    return await this.dotsService.thumbsDown(id);
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
