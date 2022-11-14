import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { Artist } from 'src/domain/artists/artist.entity';
import { UpdateArtistDto } from 'src/domain/artists/dto/update-artist.dto';
import { Auction } from 'src/domain/auctions/auction.entity';
import { UpdateProfileDto } from 'src/domain/profiles/dto/update-profile.dto';
import { Profile } from 'src/domain/profiles/profile.entity';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/user.entity';
import { randomName } from 'src/helpers/random-filename';
import { makeUsername } from 'src/helpers/random-username';
import { S3Service } from 'src/services/aws/s3.service';
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
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // [관리자] User 생성
  async create(dto: CreateUserDto): Promise<User> {
    const user = this.repository.create(dto);
    const dbUser = await this.repository.save(user);
    if (dbUser.username) {
      return dbUser;
    }
    const username = makeUsername(dbUser.id);
    return this.update(dbUser.id, { username });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  // todo. hey...
  // found the following snippet on https://github.com/ppetzold/nestjs-paginate/issues/265
  // see if we can take a similar approach to this later.
  //
  // const queryBuilder = this.transactionRepository
  //     .createQueryBuilder('transaction')
  //     .leftJoinAndSelect('transaction.charges', 'charges')
  //     .where((qb) =>
  //       (qb) =>
  //         qb.subQuery()
  //           .select('sum(c.amount)')
  //           .from(Charge, 'c')
  //           .where('c.transactionId = transaction.id')
  //           .getQuery() + ' = totalAmount',
  //       { totalAmount },
  //     );
  // return paginate(query, queryBuilder, {...})
  //
  // [관리자] ExtendedUser 리스트 w/ Pagination
  // - Not quite sure how to hydrate raw query result to an entity in TypeORM
  // - this is the only coarse way I can make it work. So, live with it.
  async findAllExtended(query: PaginateQuery): Promise<Paginated<User>> {
    let [sortKey, sortOrder] = ['id', 'DESC'];
    if (query.sortBy && query.sortBy.length) {
      [sortKey, sortOrder] = query.sortBy[0];
    }

    const conditions = [];
    if (query.filter) {
      if (Object.keys(query.filter).includes('sellerType')) {
        if (query.filter.sellerType === 'RESELLER') {
          conditions.push(`sellerType = 'RESELLER'`);
        } else {
          conditions.push(`sellerType LIKE 'ARTIST%'`);
        }
      }
    }
    if (query.search && query.searchBy) {
      conditions.push(
        `UPPER(${query.searchBy}) LIKE '%${query.search.toUpperCase()}%'`,
      );
    }

    const whereClause =
      conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') + ' ' : ' ';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const entityManager = this.repository.manager;
    const [{ total }] = await entityManager.query(
      'SELECT COUNT(*) AS total FROM user' + whereClause,
    );
    //! Question. do we even need payCount property in profile model?
    const data = await entityManager.query(
      '\
SELECT `user`.*, \
`artist`.id AS artistId, `artist`.sellerType, \
(SELECT COUNT(`artwork`.id) FROM `artwork` LEFT JOIN artist ON artist.id = artwork.ownerId WHERE `artist`.userId = `user`.id) AS artworkCount, \
(SELECT COUNT(DISTINCT(`bid`.auctionId)) FROM `bid` WHERE `bid`.userId = `user`.id) AS auctionCount, \
(SELECT COUNT(*) FROM `order` WHERE `order`.userId = `user`.id AND `order`.orderStatus = "PAID") AS payCount, \
(SELECT COUNT(*) FROM `bid` WHERE `bid`.userId = `user`.id) AS bidCount \
FROM `user` \
LEFT JOIN `artist` ON `artist`.userId = `user`.id' +
        whereClause +
        `ORDER BY ${sortKey} ${sortOrder} LIMIT ? OFFSET ?`,
      [limit, (page - 1) * limit],
    );
    const totalPages = Math.ceil(total / limit);
    const hasPreviousPage = page > 1;
    const hasNextPage = page < totalPages;
    const result = new Paginated<User>();
    result.data = data.map((e: any) => {
      delete e.password;
      e.artworkCount = parseInt(e.artworkCount, 10);
      e.auctionCount = parseInt(e.auctionCount, 10);
      e.payCount = parseInt(e.payCount, 10);
      e.bidCount = parseInt(e.bidCount, 10);
      return e;
    });
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

  // User 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.artist', 'artist')
      .loadRelationCountAndMap('user.artworkCount', 'user.artworks');

    const config: PaginateConfig<User> = {
      sortableColumns: ['id', 'username', 'email'],
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

  // User 상세보기 (w/ id)
  async findUserDetailById(
    id: number,
    relations: string[] = [],
  ): Promise<User> {
    console.log(id);
    try {
      const [data] = await this.repository.manager.query(
        'SELECT \
  (SELECT COUNT(*) FROM `follow` WHERE `followingId` = ?) AS followerCount, \
  (SELECT COUNT(*) FROM `follow` WHERE `followerId` = ?) AS followingCount \
  ',
        [id, id],
      );
      const response = await this.repository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: true,
      });

      response.followerCount = +data.followerCount;
      response.followingCount = +data.followingCount;
      return response;
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // User 상세보기 (w/ id)
  async findById(id: number, relations: string[] = []): Promise<User> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            withDeleted: true,
          })
        : await this.repository.findOneOrFail({
            where: { id },
            withDeleted: true,
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // User 상세보기 (w/ unique key)
  async findByUniqueKey(params: FindOneOptions): Promise<User> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // [관리자] User 갱신
  async updateExtended(id: number, body: any): Promise<User> {
    console.log(body, '~~ body');

    // avatar
    if (!body.avatar) {
      body.avatar = 'https://cdn.fleaauction.world/images/user.png';
    }
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
        // if exists, update it
        const artist = await this.artistRepository.preload({
          id: body.artistId,
          ...artistDto,
        });
        await this.artistRepository.save(artist);
      } else {
        // otherwise, create one
        const artist = this.artistRepository.create({
          ...artistDto,
          userId: id,
        });
        await this.artistRepository.save(artist);
      }
    } else {
      // if exists, drop it
      if (dbUser.artist) {
        await this.artistRepository.remove(dbUser.artist);
      }
    }

    // user
    const user = await this.repository.preload({ id, ...body });
    const a = await this.repository.save(user);
    return a;
  }

  // User 갱신
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const dbUser = await this.findById(id);
    if (dto.usernamedAt && dbUser.usernamedAt) {
      const oldDate = moment(dbUser.usernamedAt);
      const newDate = moment(dto.usernamedAt);
      const diffInDays = newDate.diff(oldDate, 'days');
      if (diffInDays < 20) {
        throw new BadRequestException(`${20 - diffInDays} days remain`);
      }
    }

    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  // User 프로필사진 갱신
  async upload(id: number, file: Express.Multer.File): Promise<User> {
    // see if id is valid
    await this.findById(id);
    const path = `local/users/${id}/${randomName('avatar')}`;
    try {
      // image processing using Jimp
      await this.s3Service.uploadWithResizing(file, path, 640);
    } catch (e) {
      console.log(e);
    }
    // upload the manipulated image to S3
    // update users table
    const avatar = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { avatar });
  }

  // User 비밀번호 갱신
  async changePassword(id: number, dto: ChangePasswordDto): Promise<User> {
    const user = await this.findById(id);
    const passwordMatches = await bcrypt.compare(dto.current, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('invalid credentials');
    }
    user.password = dto.password;
    return await this.repository.save(user);
  }

  // User 와 연계된 Profile 갱신
  async updateProfile(id: number, dto: UpdateProfileDto): Promise<Profile> {
    const user = await this.findById(id, ['profile']);
    const profileId = user.profile.id;

    const profile = await this.profileRepository.preload({
      id: profileId,
      ...dto,
    });
    return await this.profileRepository.save(profile);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.softRemove(user);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.remove(user);
  }

  // User 탈퇴
  async quit(id: number, dto: DeleteUserDto): Promise<any> {
    const user = await this.findById(id);
    try {
      // following 관계 hard 삭제
      await this._hardRemovalOnFollow(id);
      // article comment soft 삭제
      await this._softRemovalOnArticleComments(id);
      // stock comment soft 삭제 (commeted out for now)
      // await this._softRemovalOnStockComments(id);
      // private information 변경
      await this._voidPersonalInformation(id);

      // update user model
      user.pushToken = dto.reason;
      user.isActive = false;
      user.isAnonymous = false;
      user.isPrivate = false;
      user.isBanned = false;
      await user.save();
      // soft deletion
      await this.softRemove(id);
    } catch (e) {
      throw new BadRequestException('already deleted');
    }

    this.slack.send(
      `[local-test] 다음 사용자가 탈퇴했습니다.\n- 아이디:${id}\n- 이름:${user.username}(실명:${user.realname})\n- 전화:${user.phone}\n- 이메일:${user.email}`,
    );

    return {
      data: 'ok',
    };
  }

  // 사용자 s3 파일 삭제
  async deleteS3file(url: string) {
    if (url === 'https://cdn.fleaauction.world/images/user.png') {
      return;
    }

    try {
      await this.s3Service.delete(url);
      return { data: { url } };
    } catch (e) {
      console.log(url, e, 'dang... s3 failed?');
    }
  }

  //--------------------------------------------------------------------------//
  // Some extra shit
  //--------------------------------------------------------------------------//

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async increasePayCount(id: number): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount + 1' })
      .where('userId = :id', { id })
      .execute();
  }

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async decreasePayCount(id: number): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount - 1' })
      .where('userId = :id', { id })
      .execute();
  }

  // 내가 판매하는(소유한) 작품의 경매
  async getOwnedAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo refactor) make use of subquery (priority: low)
    const auctionIds = await this.repository.manager.query(
      'SELECT auction.id AS auctionId FROM user \
      INNER JOIN artist ON artist.`userId` = user.id  \
      INNER JOIN artwork ON artwork.`ownerId` = artist.id \
      INNER JOIN auction ON auction.`artworkId` = artwork.id \
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
      relations: ['artwork'],
    };

    return paginate(query, queryBuilder, config);
  }

  // 내가 입찰했던 경매
  async getBidAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo refactor) make use of subquery (priority: low)
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
      relations: ['artwork'],
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
      relations: ['artwork'],
    };

    return paginate(query, queryBuilder, config);
  }

  // 내가 결제했던 경매
  async getPaidAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    const auctionIds = await this.repository.manager.query(
      'SELECT auction.id AS auctionId FROM `order` \
      INNER JOIN auction ON auction.id = `order`.auctionId \
      WHERE `order`.status = "PAID" AND `order`.userId = ?',
      [id],
    );

    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .whereInIds(auctionIds.map((i: any) => i.auctionId));

    const config: PaginateConfig<Auction> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
      relations: ['artwork'],
    };

    return paginate<Auction>(query, queryBuilder, config);
  }

  // 내가 북마크한 경매
  async getBookmarkAuctions(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    // todo refactor) make use of subquery (priority: low)
    const auctionIds = await this.repository.manager.query(
      'SELECT auction.id AS auctionId FROM user \
      INNER JOIN auction_bookmarker ON user.id = auction_bookmarker.`userId` \
      INNER JOIN auction ON auction.id = auction_bookmarker.`auctionId` \
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
      relations: ['artwork'],
    };

    return paginate(query, queryBuilder, config);
  }

  //--------------------------------------------------------------------------//
  // Some private shit
  //--------------------------------------------------------------------------//

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

  async _softRemovalOnStockComments(id: number) {
    const stockCommentRows = await this.repository.manager.query(
      'SELECT id FROM stock_comment WHERE userId = ?',
      [id],
    );
    const stockCommentIds = stockCommentRows.map((i: any) => i.id);
    if (stockCommentIds.length > 0) {
      await this.repository.manager.query(
        'UPDATE stock_comment SET deletedAt = NOW() WHERE id IN (?) OR parentId IN (?)',
        [stockCommentIds, stockCommentIds],
      );
    }
  }

  async _voidPersonalInformation(id: number): Promise<any> {
    const user = await this.findById(id);
    const email = user.email;
    const phone = user.phone;
    user.email = `${email}.deleted`;
    user.phone = `---${phone.substring(3)}`;
    await this.repository.save(user);
  }
}
