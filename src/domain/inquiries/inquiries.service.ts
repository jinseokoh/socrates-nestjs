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
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly repository: Repository<Inquiry>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateInquiryDto): Promise<Inquiry> {
    const question = this.repository.create(dto);
    return await this.repository.save(question);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Inquiry>> {
    return await paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        questionType: [FilterOperator.EQ],
      },
      relations: ['user', 'comments'], // can be removed.
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Inquiry> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async count(title: string): Promise<number> {
    return await this.repository.countBy({
      title: title,
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateInquiryDto): Promise<Inquiry> {
    const question = await this.repository.preload({ id, ...dto });
    if (!question) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(question);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Inquiry> {
    const question = await this.findById(id);
    return await this.repository.softRemove(question);
  }

  async remove(id: number): Promise<Inquiry> {
    const question = await this.findById(id);
    return await this.repository.remove(question);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('question', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }
}
