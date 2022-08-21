import {
  BadRequestException,
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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { NumberData } from 'src/common/types/number-data.type';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { SyncArtworkUsersDto } from 'src/domain/artworks/dto/sync-artwork-users.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('artworks')
export class ArtworkUsersController {
  constructor(private readonly artworksService: ArtworksService) {}

  @ApiOperation({ description: '작품 좋아하는 사용자 sync' })
  @Post(':id/users')
  async sync(
    @Param('id') id: number,
    @Body() dto: SyncArtworkUsersDto,
  ): Promise<Artwork> {
    return await this.artworksService.syncUsers(id, dto);
  }

  @ApiOperation({ description: '작품 좋아하는 사용자 attach' })
  @Put(':artworkId/users/:userId')
  async attach(
    @CurrentUserId() id: number,
    @Param('artworkId') artworkId: number,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.artworksService.attachUser(
      artworkId,
      userId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '작품 좋아하는 사용자 detach' })
  @Delete(':artworkId/users/:userId')
  async detach(
    @CurrentUserId() id: number,
    @Param('artworkId') artworkId: number,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.artworksService.detachUser(
      artworkId,
      userId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '리셀러 등록' })
  @Put(':artworkId/owners/:ownerId')
  async add(
    @CurrentUserId() id: number,
    @Param('artworkId') artworkId: number,
    @Param('ownerId') ownerId: number,
  ): Promise<Artwork> {
    if (id !== ownerId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return this.artworksService.update(artworkId, { ownerId });
  }

  @ApiOperation({ description: '리셀러 삭제' })
  @Delete(':artworkId/owners/:ownerId')
  async remove(
    @CurrentUserId() id: number,
    @Param('artworkId') artworkId: number,
    @Param('ownerId') ownerId: number,
  ): Promise<Artwork> {
    if (id !== ownerId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return this.artworksService.update(artworkId, { ownerId: null });
  }
}
