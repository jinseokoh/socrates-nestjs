import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { NumberData } from 'src/common/types/number-data.type';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { SyncArtworkHashtagsDto } from 'src/domain/artworks/dto/sync-artwork-hashtags.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('artworks')
export class ArtworkHashtagsController {
  constructor(private readonly artworksService: ArtworksService) {}

  @ApiOperation({ description: '작품 해쉬택 sync' })
  @Post(':id/hashtags')
  async sync(
    @Param('id') id: number,
    @Body()
    dto: SyncArtworkHashtagsDto,
  ): Promise<Artwork> {
    return await this.artworksService.syncHashtags(id, dto);
  }

  @ApiOperation({ description: '작품 해쉬택 attach' })
  @Put(':artworkId/hashtags/:hashtagId')
  async attach(
    @Param('artworkId') artworkId: number,
    @Param('hashtagId') hashtagId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.artworksService.attachHashtag(
      artworkId,
      hashtagId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '작품 해쉬택 detach' })
  @Delete(':artworkId/hashtags/:hashtagId')
  async detach(
    @Param('artworkId') artworkId: number,
    @Param('hashtagId') hashtagId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.artworksService.detachHashtag(
      artworkId,
      hashtagId,
    );
    return { data: affectedRows };
  }
}
