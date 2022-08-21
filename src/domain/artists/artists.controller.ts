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
import { Artist } from 'src/domain/artists/artist.entity';
import { ArtistsService } from 'src/domain/artists/artists.service';
import { CreateArtistDto } from 'src/domain/artists/dto/create-artist.dto';
import { UpdateArtistDto } from 'src/domain/artists/dto/update-artist.dto';
import { ValidateUserIdPipe } from 'src/domain/artists/pipes/validate-user-id.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @ApiOperation({ description: '작가 생성' })
  @Post()
  async create(
    @Body(ValidateUserIdPipe)
    dto: CreateArtistDto,
  ): Promise<Artist> {
    return await this.artistsService.create(dto);
  }

  @ApiOperation({ description: '작가 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getArtists(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Artist>> {
    return await this.artistsService.findAll(query);
  }

  @ApiOperation({ description: '작가 상세보기' })
  @Get(':id')
  async getArtistById(@Param('id') id: number): Promise<Artist> {
    return await this.artistsService.findById(id, ['artworks']);
  }

  @ApiOperation({ description: '작가 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateArtistDto,
  ): Promise<Artist> {
    return await this.artistsService.update(id, dto);
  }

  @ApiOperation({ description: '작가 hard 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Artist> {
    return await this.artistsService.remove(id);
  }
}
