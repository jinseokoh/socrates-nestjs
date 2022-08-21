import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { NumberData } from 'src/common/types/number-data.type';
import { SyncHashtagArtworksDto } from 'src/domain/hashtags/dto/sync-hashtag-artworks.dto';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { HashtagsService } from 'src/domain/hashtags/hashtags.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('hashtags')
export class HashtagArtworksController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @ApiOperation({ description: '해쉬택 작품 일괄등록' })
  @Put(':id')
  async sync(
    @Param('id') id: number,
    @Body()
    dto: SyncHashtagArtworksDto,
  ): Promise<Hashtag> {
    return await this.hashtagsService.sync(id, dto);
  }

  @ApiOperation({ description: '해쉬택 작품 추가' })
  @Put(':hashtagId/artworks/:artworkId')
  async attach(
    @Param('hashtagId') hashtagId: number,
    @Param('artworkId') artworkId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.hashtagsService.attach(
      hashtagId,
      artworkId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '해쉬택 작품 삭제' })
  @Delete(':hashtagId/artworks/:artworkId')
  async detach(
    @Param('hashtagId') hashtagId: number,
    @Param('artworkId') artworkId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.hashtagsService.detach(
      hashtagId,
      artworkId,
    );
    return { data: affectedRows };
  }
}
