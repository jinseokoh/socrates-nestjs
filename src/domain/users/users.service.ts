import { S3 } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import * as Jimp from 'jimp';
import * as moment from 'moment';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { AWS_S3_CONNECTION } from 'src/common/constants';
import { IKeyVal } from 'src/common/interfaces';
import { Artist } from 'src/domain/artists/artist.entity';
import { UpdateArtistDto } from 'src/domain/artists/dto/update-artist.dto';
import { Auction } from 'src/domain/auctions/auction.entity';
import { UpdateProfileDto } from 'src/domain/profiles/dto/update-profile.dto';
import { Profile } from 'src/domain/profiles/profile.entity';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/user.entity';
import { randomName } from 'src/helpers/random-filename';
import { FindOneOptions } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class UsersService {
  constructor(
    @InjectSlack() private readonly slack: IncomingWebhook,
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @Inject(AWS_S3_CONNECTION)
    private readonly s3: S3,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    console.log(dto, '<~~~~~~~~~~~~~ dto');
    const user = this.repository.create(dto);
    return await this.repository.save(user);
  }

  async upload(id: number, file: Express.Multer.File): Promise<User> {
    const path = `local/users/${id}/${randomName('avatar')}`;
    try {
      // see if id is valid
      await this.findById(id);
      // image processing using Jimp
      const img = await Jimp.read(Buffer.from(file.buffer));
      const resizedImg = await img
        .resize(640, Jimp.AUTO)
        .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: resizedImg,
        Key: path,
        ACL: 'private',
        ContentType: 'image/jpeg',
      };
      await this.s3.putObject(params);
    } catch (e) {
      console.log(e);
    }
    // upload the manipulated image to S3
    // update users table
    const avatar = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { avatar });
  }

  async findAllForAdmin(
    query: PaginateQuery,
    like: IKeyVal | null = null,
    sort: IKeyVal | null = null,
  ): Promise<Paginated<User>> {
    let conditions = ['deletedAt IS NULL'];
    if (like) {
      conditions = [...conditions, `${like.key} LIKE '%${like.val}%'`];
    }
    let sortKey = 'id';
    let sortOrder = 'DESC';
    if (sort) {
      sortKey = sort.key;
      sortOrder = sort.val;
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [{ total }] = await this.repository.manager.query(
      `SELECT COUNT(*) AS total FROM user WHERE ${conditions.join(' AND ')}`,
    );
    const data = await this.repository.manager.query(
      `SELECT
      user.*,
      artist.id AS artistId,
      (SELECT COUNT(*) FROM bid WHERE bid.userId = user.id) AS bidCount,
      (SELECT COUNT(DISTINCT(bid.auctionId)) FROM bid WHERE bid.userId = user.id) AS auctionCount,
      (SELECT COUNT(*) FROM artwork WHERE artwork.ownerId = user.id) AS artworkCount
      FROM user
      LEFT JOIN artist ON artist.userId = user.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortKey} ${sortOrder} LIMIT ? OFFSET ?`,
      [limit, (page - 1) * limit],
    );

    const totalPages = Math.ceil(total / limit);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;
    const result = new Paginated<User>();
    result.data = data;

    result.meta = {
      itemsPerPage: limit,
      totalItems: total,
      currentPage: page,
      totalPages: totalPages,
      sortBy: [],
      searchBy: [],
      search: '',
    };
    const links: any = {
      current: `${query.path}?page=${page}`,
    };
    if (hasPreviousPage) {
      links.first = `${query.path}?page=1`;
      links.previous = `${query.path}?page=${page - 1}`;
    }
    if (hasNextPage) {
      links.next = `${query.path}?page=${page + 1}`;
      links.last = `${query.path}?page=${totalPages}`;
    }
    result.links = links;

    return result;
  }

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.artist', 'artist')
      .loadRelationCountAndMap('user.artworkCount', 'user.artworks');

    const config: PaginateConfig<User> = {
      sortableColumns: ['id', 'username', 'email', 'score'],
      searchableColumns: ['email', 'username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        role: [FilterOperator.EQ, FilterOperator.IN],
        isActive: [FilterOperator.EQ],
      },
    };

    return await paginate<User>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<User> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<User> {
    return await this.repository.findOne(params);
  }

  async updateForAdmin(id: number, body: any): Promise<User> {
    // profile
    const profileDto: UpdateProfileDto = new UpdateProfileDto();
    Object.keys(body).filter((key) => {
      if (key.startsWith('profile.') && body[key] !== null) {
        const pKey = key.replace('profile.', '');
        profileDto[pKey] =
          typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    });
    if (body.profileId > 0) {
      const profile = await this.profileRepository.preload({
        id: body.profileId,
        ...profileDto,
      });
      await this.profileRepository.save(profile);
    }

    // artist
    const dbUser = await this.findById(id, ['artist']);
    if (body.isArtist) {
      const artistDto: UpdateArtistDto = new UpdateArtistDto();
      Object.keys(body).filter((key) => {
        if (key.startsWith('artist.') && body[key]) {
          const aKey = key.replace('artist.', '');
          artistDto[aKey] =
            typeof body[key] === 'string' ? body[key].trim() : body[key];
        }
      });
      if (dbUser.artist) {
        // if artist model exists, edit it
        const artist = await this.artistRepository.preload({
          id: body.artistId,
          ...artistDto,
        });
        await this.artistRepository.save(artist);
      } else {
        // if artist model doesn't exist, create one
        const artist = this.artistRepository.create({
          ...artistDto,
          userId: id,
        });
        await this.artistRepository.save(artist);
      }
    } else {
      // if artist model exists, drop it
      if (dbUser.artist) {
        await this.artistRepository.remove(dbUser.artist);
      }
    }

    // user
    const user = await this.repository.preload({ id, ...body });
    return await this.repository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const dbUser = await this.findById(id);
    if (dto.usernamedAt && dbUser.usernamedAt) {
      const oldDate = moment(dbUser.usernamedAt);
      const newDate = moment(dto.usernamedAt);
      const diffInDays = newDate.diff(oldDate, 'days');
      if (diffInDays < 15) {
        throw new BadRequestException(
          `wait ${15 - diffInDays} more day(s) to change username`,
        );
      }
    }
    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  async increaseScore(id: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({ score: () => 'score + 1' })
      .where('id = :id', { id })
      .execute();
  }

  async decreaseScore(id: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(User)
      .set({ score: () => 'score - 1' })
      .where('id = :id', { id })
      .execute();
  }

  async softRemove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.softRemove(user);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.remove(user);
  }

  async quit(id: number): Promise<any> {
    const { username, phone, email, realname } = await this.findById(id);
    try {
      // following 관계 hard 삭제
      await this._hardRemovalOnFollow(id);
      // article comment soft 삭제
      await this._softRemovalOnArticleComments(id);
      // post comment soft 삭제
      await this._softRemovalOnPostComments(id);
      // private information 변경
      await this._amendPrivateInformation(id);
      // soft deletion
      await this.softRemove(id);
    } catch (e) {
      throw new HttpException('Already deleted', 413);
    }

    const message = `[local-test] 다음 사용자가 탈퇴했습니다.\n- 아이디:${id}\n- 이름:${username}(실명:${realname})\n- 전화:${phone}\n- 이메일:${email}`;
    this.slack.send(message);

    return {
      data: 'ok',
    };
  }

  async _hardRemovalOnFollow(id: number) {
    await this.repository.manager.query(
      'DELETE FROM follow WHERE followingId = ? OR followerId = ?',
      [id, id],
    );
  }

  async _softRemovalOnArticleComments(id: number) {
    const articleCommetRows = await this.repository.manager.query(
      'SELECT id FROM article_comment WHERE userId = ?',
      [id],
    );
    const articleCommentIds = articleCommetRows.map((i: any) => i.id);
    if (articleCommentIds.length > 0) {
      await this.repository.manager.query(
        'UPDATE article_comment SET deletedAt = NOW() WHERE id IN (?) OR parentId IN (?)',
        [articleCommentIds, articleCommentIds],
      );
    }
  }

  async _softRemovalOnPostComments(id: number) {
    const postCommentRows = await this.repository.manager.query(
      'SELECT id FROM article_comment WHERE userId = ?',
      [id],
    );
    const postCommentIds = postCommentRows.map((i: any) => i.id);
    if (postCommentIds.length > 0) {
      await this.repository.manager.query(
        'UPDATE post_comment SET deletedAt = NOW() WHERE id IN (?) OR parentId IN (?)',
        [postCommentIds, postCommentIds],
      );
    }
  }

  async _amendPrivateInformation(id: number): Promise<any> {
    const user = await this.findById(id);
    const email = user.email;
    const phone = user.phone;
    user.email = `${email}.deleted`;
    user.phone = `---${phone.substring(3)}`;
    await this.repository.save(user);
  }

  // 내가 판매하는(소유한) 작품의 경매
  async getOwnedAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo. make use of subquery (priority: low)
    const auctionIds = await this.repository.manager.query(
      'SELECT auction.id AS auctionId FROM user \
      INNER JOIN artwork ON user.id = artwork.`ownerId` \
      INNER JOIN auction ON artwork.id = auction.`artworkId` \
      WHERE user.id = ?',
      [id],
    );
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .whereInIds(auctionIds.map((i: any) => i.auctionId));

    const config: PaginateConfig<Auction> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        weeks: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // 내가 입찰했었던 경매
  async getBidAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo. make use of subquery (priority: low)
    const auctionIds = await this.repository.manager.query(
      'SELECT DISTINCT(auctionId) FROM bid WHERE userId = ?',
      [id],
    );
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .whereInIds(auctionIds.map((i: any) => i.auctionId));

    const config: PaginateConfig<Auction> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        weeks: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // 내가 낙찰받은 경매
  async getWonAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .where('auction.status = "ENDED"')
      .andWhere('auction.lastBidderId = :id', { id });

    const config: PaginateConfig<Auction> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        weeks: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  async getLikedAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo. make use of subquery (priority: low)
    const auctionIds = await this.repository.manager.query(
      'SELECT auction.id AS auctionId FROM user \
      INNER JOIN artwork_user_like ON user.id = artwork_user_like.`userId` \
      INNER JOIN artwork ON artwork.id = artwork_user_like.artworkId \
      LEFT JOIN auction ON artwork.id = auction.artworkId \
      WHERE user.id = ?',
      [id],
    );
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .whereInIds(auctionIds.map((i: any) => i.auctionId));

    const config: PaginateConfig<Auction> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        weeks: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }
}
