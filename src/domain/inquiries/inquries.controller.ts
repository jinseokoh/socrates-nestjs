import {
  BadRequestException,
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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { SignedUrl } from 'src/common/types';
import { CreateInquiryDto } from 'src/domain/inquiries/dto/create-inquiry.dto';
import { UpdateInquiryDto } from 'src/domain/inquiries/dto/update-inquiry.dto';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateInquiryDto,
  ): Promise<Inquiry> {
    return await this.inquiriesService.create({ ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getInquries(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Inquiry>> {
    return await this.inquiriesService.findAll(query);
  }

  //! not being used anymore
  @ApiOperation({ description: '질문 상세보기 w/ Pagination' })
  @Get(':id')
  async getCommentsById(@Param('id') inquiryId: number): Promise<Inquiry> {
    return await this.inquiriesService.findById(inquiryId, ['user']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateInquiryDto,
  ): Promise<Inquiry> {
    return await this.inquiriesService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Inquiry> {
    return await this.inquiriesService.softRemove(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('image/url')
  async getSignedUrl(
    @CurrentUserId() id: number,
    @Body('mimeType') mimeType: string,
  ): Promise<SignedUrl> {
    if (mimeType) {
      return await this.inquiriesService.getSignedUrl(id, mimeType);
    }
    throw new BadRequestException('mimeType is missing');
  }
}
