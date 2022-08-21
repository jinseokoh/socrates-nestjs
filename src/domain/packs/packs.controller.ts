import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePackDto } from 'src/domain/packs/dto/create-pack.dto';
import { UpdatePackDto } from 'src/domain/packs/dto/update-pack.dto';
import { Pack } from 'src/domain/packs/pack.entity';
import { PacksService } from 'src/domain/packs/packs.service';
import { UniqueTitlePipe } from 'src/domain/packs/pipes/unique-title.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @ApiOperation({ description: '옥션팩 생성' })
  @Post()
  async create(
    @Body(UniqueTitlePipe)
    dto: CreatePackDto,
  ): Promise<Pack> {
    return await this.packsService.create(dto);
  }

  @ApiOperation({ description: '옥션팩 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getPacks(@Paginate() query: PaginateQuery): Promise<Paginated<Pack>> {
    return await this.packsService.findAll(query);
  }

  @ApiOperation({ description: '옥션팩 상세보기' })
  @Get(':id')
  async getPackById(@Param('id') id: number): Promise<Pack> {
    const pack = await this.packsService.findById(id, [
      'auctions',
      'artists',
      'articles',
      'relatedPacks',
    ]);

    return pack;
  }

  @ApiOperation({ description: '옥션팩 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(UniqueTitlePipe) dto: UpdatePackDto,
  ): Promise<Pack> {
    return await this.packsService.update(id, dto);
  }

  @ApiOperation({ description: '옥션팩 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Pack> {
    return await this.packsService.softRemove(id);
  }
}
