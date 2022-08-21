import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SyncRelatedPacksDto } from 'src/domain/packs/dto/sync-related-packs.dto';
import { Pack } from 'src/domain/packs/pack.entity';
import { PacksService } from 'src/domain/packs/packs.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('packs')
export class RelatedPacksController {
  constructor(private readonly packsService: PacksService) {}

  @ApiOperation({ description: '관리자) 옥션팩 옥션 일괄등록' })
  @Post(':id/packs')
  async sync(
    @Param('id') id: number,
    @Body() dto: SyncRelatedPacksDto,
  ): Promise<Pack> {
    return await this.packsService.syncRelatedPacks(id, dto);
  }

  /*
   * todo) I intentionally excluded 2 APIs (namely, attach and detach)
   *
   * the reason is that adding a AUCTION to a PACK results in
   * 1) not only `pack_auction` update
   * 2) but `pack_artist` and `pack.images` updates as well.
   *
   * didn't want to spend time on something uncommon to use. I will
   * get back to this when the need arises.
   */
}
