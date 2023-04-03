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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { AddressToRegionPipe } from 'src/domain/meetups/pipes/address-to-region.pipe';
import { ExtractCategoriesPipe } from 'src/domain/meetups/pipes/extract-categories-pipe';
import { VenuesService } from 'src/domain/venues/venues.service';
import { multerOptions } from 'src/helpers/multer-options';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupsController {
  constructor(
    private readonly meetupsService: MeetupsService,
    private readonly venuesService: VenuesService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body(AddressToRegionPipe, ExtractCategoriesPipe) dto: CreateMeetupDto,
  ): Promise<Meetup> {
    const createMeetupDto = dto.userId ? { ...dto } : { ...dto, userId };
    const meetup = await this.meetupsService.create(createMeetupDto);
    // const venue = await this.venuesService.create({
    //   ...dto.venue,
    //   meetupId: meetup.id,
    // });
    return meetup;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getMeetups(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return this.meetupsService.findAll(query);
  }

  @ApiOperation({ description: 'Meetup 상세보기' })
  @Get(':id')
  async getMeetupById(@Param('id') id: string): Promise<Meetup> {
    console.log(id);
    return await this.meetupsService.findById(id, [
      'user',
      'categories',
      'venue',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetupDto,
  ): Promise<Meetup> {
    return await this.meetupsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id') id: string): Promise<Meetup> {
    return await this.meetupsService.softRemove(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '단일 이미지 저장후 URL (string) 리턴' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post('image')
  async uploadImage(
    @CurrentUserId() userId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnyData> {
    return await this.meetupsService.uploadImage(userId, file);
  }

  @ApiOperation({ description: 'Artwork 이미지들 저장후 URLs (string[]) 리턴' })
  @UseInterceptors(FilesInterceptor('files', 9, multerOptions))
  @Post('images')
  async uploadImages(
    @CurrentUserId() userId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    return await this.meetupsService.uploadImages(userId, files);
  }

  @ApiOperation({
    description: 's3 직접 업로드를 위한 signedUrl 리턴',
  })
  @Post('image/url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body('mimeType') mimeType: string,
  ): Promise<AnyData> {
    if (mimeType) {
      return await this.meetupsService.getSignedUrl(userId, mimeType);
    }
    return { data: '' };
  }
}
