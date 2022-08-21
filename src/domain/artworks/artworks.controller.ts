import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { CreateArtworkDto } from 'src/domain/artworks/dto/create-artwork.dto';
import { UpdateArtworkDto } from 'src/domain/artworks/dto/update-artwork.dto';
import { ValidateArtistIdPipe } from 'src/domain/artworks/pipes/validate-artist-id.pipe';
import { multerOptions } from 'src/helpers/multer-options';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  @ApiOperation({ description: '작품 생성' })
  @Post()
  async create(
    @Body(ValidateArtistIdPipe)
    dto: CreateArtworkDto,
  ): Promise<Artwork> {
    return await this.artworksService.create(dto);
  }

  @ApiOperation({ description: '작품 이미지 생성 (최대 5장)' })
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  @Post(':id/images')
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('id') id: number,
  ): Promise<Artwork> {
    return await this.artworksService.upload(id, files);
  }

  @ApiOperation({ description: '벽사진 추가' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/wall')
  async wall(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: number,
  ): Promise<Artwork> {
    return await this.artworksService.composite(id, file);
  }

  @ApiOperation({ description: '작품 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getArtworks(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Artwork>> {
    return this.artworksService.findAll(query);
  }

  @ApiOperation({ description: '작품 상세보기' })
  @Get(':id')
  async getArtworkById(@Param('id') id: number): Promise<Artwork> {
    return await this.artworksService.findById(id, ['artist', 'auctions']);
  }

  @ApiOperation({ description: '작품 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateArtworkDto,
  ): Promise<Artwork> {
    return await this.artworksService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 작품 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Artwork> {
    return await this.artworksService.softRemove(id);
  }
}
