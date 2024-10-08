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
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly repository: Repository<Inquiry>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateInquiryDto): Promise<Inquiry> {
    const entity = this.repository.create(dto);
    const inquiry = await this.repository.save(entity);

    if (dto.targetEntity) {
      if (dto.targetEntity.model === 'user') {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `inquiry_user` (inquiryId, userId) VALUES (?, ?)',
          [inquiry.id, dto.targetEntity.id],
        );
      }
      if (dto.targetEntity.model === 'meetup') {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `inquiry_meetup` (inquiryId, meetupId) VALUES (?, ?)',
          [inquiry.id, dto.targetEntity.id],
        );
      }
      if (dto.targetEntity.model === 'connection') {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `inquiry_connection` (inquiryId, connectionId) VALUES (?, ?)',
          [inquiry.id, dto.targetEntity.id],
        );
      }
    }

    return inquiry;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Inquiry>> {
    return await paginate(query, this.repository, {
      relations: [
        'user',
        'comments',
        'flaggedUsers',
        'flaggedMeetups',
        'flaggedConnections',
      ], // can be removed.
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
