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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { SignedUrl } from 'src/common/types';
import { Banner } from 'src/domain/banners/entities/banner.entity';
import { BannersService } from 'src/domain/banners/banners.service';
import { CreateBannerDto } from 'src/domain/banners/dto/create-banner.dto';
import { UpdateBannerDto } from 'src/domain/banners/dto/update-banner.dto';
import { multerOptions } from 'src/helpers/multer-options';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Banner 생성' })
  @Post()
  async create(@Body() dto: CreateBannerDto): Promise<Banner> {
    return await this.bannersService.create(dto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'active Banner 리스트' })
  @Get()
  async getActiveBanners(): Promise<Banner[]> {
    return await this.bannersService.findActive();
  }

  @ApiOperation({ description: 'Banner 상세보기' })
  @Get(':id')
  async getBannerById(@Param('id') id: number): Promise<Banner> {
    return await this.bannersService.findById(id);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Banner 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateBannerDto,
  ): Promise<Banner> {
    console.log(dto);
    return await this.bannersService.update(id, dto);
  }

  @ApiOperation({ description: '공지사항 image 서버경유 업로드' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/image')
  async upload(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.bannersService.upload(id, file);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Banner 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Banner> {
    return await this.bannersService.remove(id);
  }

  // ------------------------------------------------------------------------ //
  // Some extra endpoints
  // ------------------------------------------------------------------------ //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.bannersService.getSignedUrl(userId, dto);
  }
}
