import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { AuctionStatus } from 'src/common/enums';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Bid } from 'src/domain/bids/bid.entity';
import { CreateBidDto } from 'src/domain/bids/dto/create-bid.dto';
import { UpdateBidDto } from 'src/domain/bids/dto/update-bid.dto';
import { User } from 'src/domain/users/user.entity';
import { truncate } from 'src/helpers/truncate';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Repository } from 'typeorm';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(
    private readonly fcmService: FcmService,
    @Inject(REDIS_PUBSUB_CLIENT)
    private readonly redisClient: ClientProxy,
    @InjectRepository(Bid)
    private readonly repository: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateBidDto): Promise<Bid> {
    this.logger.log(dto);
    const bid = this.repository.create(dto);
    const auction = await this.auctionRepository.findOne({
      id: dto.auctionId,
    });
    if (auction.status !== AuctionStatus.ONGOING) {
      throw new BadRequestException(`auction status error, ${auction.status}`);
    }
    // 시간 extend
    const updatedAuction = await this._updateWithCreateBidDto(
      auction.lastBidAmount,
      auction.bidCount,
      auction.bidExtMins,
      auction.closingTime,
      auction.status,
      dto,
    );
    if (auction.closingTime != updatedAuction.closingTime) {
      this.redisClient.emit('RealTime', {
        ...dto,
        closingTime: updatedAuction.closingTime,
      });
    }
    // 바로 이전 highest bidder
    if (auction.lastBidderId && auction.lastBidderId !== dto.userId) {
      await this._notifyPreviousBidder(
        dto.auctionId,
        dto.amount,
        auction.title,
        auction.lastBidderId,
      );
    }
    // 종료 시간이 2시간이상 남은 경우, 관심인 등록
    await this._attachAlarmingTarget(
      auction.endTime,
      dto.auctionId,
      dto.userId,
    );

    const result = await this.repository.save(bid);
    return result;
  }

  // Note that NestJS doesn't seem to allow dependency injection on a subscriber class
  // at the time of this writing. That's why I gave up setting a Bid model subscriber.
  // I've ended up having a pretty bloated method here. So, live with it.
  async _updateWithCreateBidDto(
    lastBidAmount: number,
    bidCount: number,
    bidExtMins: number,
    closingTime: Date,
    status: AuctionStatus,
    dto: CreateBidDto,
  ): Promise<Auction> {
    if (lastBidAmount >= dto.amount) {
      throw new BadRequestException(`bid amount has to be higher.`);
    }
    const now = moment().milliseconds(0); // to remove jitter
    const closing = moment(closingTime);
    if (now.isAfter(closing)) {
      //** In case when auction status is ONGOING even if it's passed closing time
      if (status === AuctionStatus.ONGOING) {
        await this.auctionRepository
          .createQueryBuilder()
          .update(Auction)
          .set({ status: AuctionStatus.ENDED })
          .where('id = :id', { id: dto.auctionId })
          .execute();
      }
      throw new BadRequestException(`already closed`);
    }
    const diff = closing.diff(now);
    const diffInMins = moment.duration(diff).asMinutes();
    const extendedTime = moment().milliseconds(0).add(bidExtMins, 'minutes');

    const payload: any = {};
    payload.id = dto.auctionId;
    payload.lastBidAmount = dto.amount;
    payload.lastBidderId = dto.userId;
    payload.bidCount = bidCount + 1;
    if (diffInMins <= bidExtMins) {
      payload.closingTime = extendedTime.utc().format('YYYY-MM-DD HH:mm:ss');
    }

    const auction = await this.auctionRepository.preload(payload);
    return await this.auctionRepository.save(auction);
  }

  // A code smell here. Injecting auction service to reuse the existing attach() method
  // would be better way to do it for sure. but, I found it ugly and cumbersome as well.
  // What do you think?
  async _attachAlarmingTarget(
    endTime: Date,
    auctionId: number,
    userId: number,
  ): Promise<any> {
    const now = moment().milliseconds(0); // to remove jitter
    const TwoHoursBeforeEnding = moment(endTime).subtract(2, 'hours');
    // found it pointless if time left less than 2 hours.
    if (now.isBefore(TwoHoursBeforeEnding)) {
      return await this.auctionRepository.manager.query(
        'INSERT IGNORE INTO `auction_user_alarm` (auctionId, userId) VALUES (?, ?)',
        [auctionId, userId],
      );
    }
  }

  // notice the previous highest bidder "somebody beat you. you'd better do something."
  async _notifyPreviousBidder(
    auctionId: number,
    amount: number,
    auctionTitle: string,
    userId: number,
  ) {
    const { pushToken } = await this.userRepository.findOne({
      id: userId,
    });
    if (pushToken) {
      const title = truncate(auctionTitle, 10);
      await this.fcmService.sendNotification(
        pushToken,
        `[플리옥션]`,
        `"${title}" 작품에 나보다 높은 ${amount.toLocaleString()}원의 입찰이 등록되었습니다.`,
        {
          name: 'auction',
          id: `${auctionId}`,
        },
      );
    }
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Bid>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        auctionId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Bid> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async update(id: number, dto: UpdateBidDto): Promise<Bid> {
    const bid = await this.repository.preload({ id, ...dto });
    if (!bid) {
      throw new NotFoundException(`bid #${id} not found`);
    }
    return await this.repository.save(bid);
  }

  async softRemove(id: number): Promise<Bid> {
    const bid = await this.findById(id);
    return await this.repository.softRemove(bid);
  }

  async remove(id: number): Promise<Bid> {
    const bid = await this.findById(id);
    return await this.repository.remove(bid);
  }
}
