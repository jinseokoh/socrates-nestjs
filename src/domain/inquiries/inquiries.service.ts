import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { SignedUrl } from 'src/common/types';
import { CreateInquiryDto } from 'src/domain/inquiries/dto/create-inquiry.dto';
import { UpdateInquiryDto } from 'src/domain/inquiries/dto/update-inquiry.dto';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryComment)
    private readonly opinionRepository: Repository<InquiryComment>,
    private readonly s3Service: S3Service,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateInquiryDto): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.save(
      this.inquiryRepository.create(dto),
    );
    return inquiry;
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  async findAll(query: PaginateQuery): Promise<Paginated<Inquiry>> {
    return await paginate(query, this.inquiryRepository, {
      relations: ['user', 'comments'], // can be removed.
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        inquiryType: [FilterOperator.EQ],
        userId: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Inquiry> {
    try {
      return relations.length > 0
        ? await this.inquiryRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.inquiryRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async count(title: string): Promise<number> {
    return await this.inquiryRepository.countBy({
      title: title,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateInquiryDto): Promise<Inquiry> {
    const question = await this.inquiryRepository.preload({ id, ...dto });
    if (!question) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.inquiryRepository.save(question);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<Inquiry> {
    const question = await this.findById(id);
    return await this.inquiryRepository.softRemove(question);
  }

  async remove(id: number): Promise<Inquiry> {
    const question = await this.findById(id);
    return await this.inquiryRepository.remove(question);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'inquiry', dto.mimeType);
    const path = `${process.env.NODE_ENV}/inquiries/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
