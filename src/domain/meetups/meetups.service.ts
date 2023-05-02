import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Status } from 'src/common/enums/status';

import { AnyData, SignedUrl } from 'src/common/types';

import { Category } from 'src/domain/categories/entities/category.entity';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class MeetupsService {
  private readonly logger = new Logger(MeetupsService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly repository: Repository<Meetup>,
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Meetup 생성
  async create(dto: CreateMeetupDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user || user?.isBanned) {
      throw new BadRequestException(`not allowed to create`);
    }

    const meetup = await this.repository.save(this.repository.create(dto));
    const venue = await this.venueRepository.save(
      this.venueRepository.create({ ...dto.venue, meetupId: meetup.id }),
    );
    meetup.venue = venue;

    // //await this._linkWithCategory(dto.category, meetup.id);
    // // await this._linkWithRegion(dto.region, meetup.id);

    return meetup;
  }

  async _linkWithCategory(categorySlug: string, meetupId: string) {
    const category = await this.categoryRepository.findOne({
      where: { slug: categorySlug },
    });
    const categories = await this.repository.manager
      .getTreeRepository(Category)
      .findAncestors(category);
    categories
      .filter((v: Category) => v.depth > 0) // remove root
      .map(async (v: Category) => {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `meetup_category` (meetupId, categoryId) VALUES (?, ?)',
          [meetupId, v.id],
        );
      });
  }

  // async _linkWithRegion(regionSlug: string, meetupId: string) {
  //   const region = await this.regionRepository.findOne({
  //     where: { slug: regionSlug },
  //   });
  //   const regions = await this.repository.manager
  //     .getTreeRepository(Region)
  //     .findAncestors(region);
  //   regions
  //     .filter((v: Region) => v.depth > 1) // remove root, korea
  //     .map(async (v: Region) => {
  //       await this.repository.manager.query(
  //         'INSERT IGNORE INTO `meetup_region` (meetupId, regionId) VALUES (?, ?)',
  //         [meetupId, v.id],
  //       );
  //     });
  // }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Meetup 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Meetup>> {
    const queryBuilder = this.repository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['title'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        region: [FilterOperator.EQ, FilterOperator.IN],
        career: [FilterOperator.EQ, FilterOperator.IN],
        gender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 상세보기
  async findById(id: string, relations: string[] = []): Promise<Meetup> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: string, dto: UpdateMeetupDto): Promise<Meetup> {
    const meetup = await this.repository.preload({ id, ...dto });
    if (!meetup) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(meetup);
  }

  async increaseViewCount(id: string): Promise<void> {
    // in case you need the increased count
    // const meetup = await this.findById(id);
    // const count = meetup.viewCount + 1;
    // meetup.viewCount = count;
    // await this.repository.save(meetup);
    // return count;
    // otherwise,
    await this.repository
      .createQueryBuilder()
      .update(Meetup)
      .where('id = :id', { id })
      .set({ viewCount: () => 'viewCount + 1' })
      .execute();
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: string): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.softRemove(Meetup);
  }

  async remove(id: string): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.remove(Meetup);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // 단일 이미지 저장후 URL (string) 리턴
  async uploadImage(
    userId: number,
    file: Express.Multer.File,
  ): Promise<AnyData> {
    const path = `${process.env.NODE_ENV}/files/${userId}/${randomName(
      'meetup',
      file.mimetype,
    )}`;
    await this.s3Service.upload(file.buffer, path);

    return { data: `${process.env.AWS_CLOUDFRONT_URL}/${path}` };
  }

  // 다중 이미지 저장후 URL (string) 리턴
  async uploadImages(
    userId: number,
    files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${process.env.NODE_ENV}/files/${userId}/${randomName(
        'meetup',
        file.mimetype,
      )}`;
      await this.s3Service.upload(file.buffer, path);
      images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);
    }

    return { data: images };
  }

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('mesa', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }

  //?-------------------------------------------------------------------------//
  //? Faves
  //?-------------------------------------------------------------------------//

  async getFavers(id: string): Promise<Meetup> {
    try {
      return await this.repository.findOneOrFail({
        where: {
          id: id,
          Matchs: {
            status: Status.FAVE,
          },
        },
        relations: [
          'Matchs',
          'Matchs.user',
          'Matchs.user.profile',
        ],
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async checkFaver(meetupId: string, userId: number): Promise<boolean> {
    const rows = await this.repository.manager.query(
      'SELECT * FROM `meetup_user` WHERE meetupId = ? AND userId = ? AND status = ?',
      [meetupId, userId, Status.FAVE],
    );
    return rows.length > 0;
  }

  async attachFaver(meetupId: string, userId: number): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `meetup_user` (meetupId, userId, status) VALUES (?, ?, ?)',
      [meetupId, userId, Status.FAVE],
    );
    console.log(affectedRows);
    if (affectedRows > 0) {
      await this.repository.increment({ id: meetupId }, 'faveCount', 1);
    }
    // doesn't seem to be necessary here
    // return await this.repository.manager.query(
    //   'UPDATE `meetup_user` SET status = ? WHERE meetupId = ? AND userId = ?',
    //   [Status.FAVE, meetupId, userId],
    // );
  }

  async detachFaver(meetupId: string, userId: number): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `meetup_user` WHERE meetupId = ? AND userId = ? AND status = ?',
      [meetupId, userId, Status.FAVE],
    );
    if (affectedRows > 0) {
      await this.repository.decrement({ id: meetupId }, 'faveCount', 1);
      // await this.repository.manager.query(
      //   'UPDATE `meetup` SET faveCount = faveCount - 1 WHERE id = ? AND faveCount > 0',
      //   [meetupId],
      // );
    }
  }
}
