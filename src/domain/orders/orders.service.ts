import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AuctionStatus } from 'src/common/enums';
import { OrderType } from 'src/common/enums/order-type';
import { Auction } from 'src/domain/auctions/auction.entity';
import { CreateOrderDto } from 'src/domain/orders/dto/create-order.dto';
import { UpdateOrderDto } from 'src/domain/orders/dto/update-order.dto';
import { Order } from 'src/domain/orders/order.entity';
import { FindOneOptions, Repository } from 'typeorm';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
  ) {}

  async create(auctionId: number): Promise<Order> {
    const auction = await this.auctionRepository.findOneOrFail({
      where: { id: auctionId },
    });
    if (auction.status !== AuctionStatus.ENDED) {
      throw new BadRequestException(`it hasn't been ended.`);
    }
    if (!auction.lastBidderId) {
      throw new BadRequestException(`no bidders.`);
    }
    if (auction.lastBidAmount < auction.reservePrice) {
      throw new BadRequestException(`doesn't meet reserve price.`);
    }

    const dto = new CreateOrderDto();
    dto.title = auction.title;
    dto.image = auction.images !== null ? auction.images[0] : null;
    dto.price = auction.lastBidAmount;
    dto.deliveryFee = auction.deliveryFee;
    dto.quantity = 1;
    dto.orderType = OrderType.AUCTION;
    dto.sku = null;
    dto.auctionId = auction.id;
    dto.userId = auction.lastBidderId;

    const order = this.repository.create(dto);
    return await this.repository.save(order);
  }

  async findAll(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Order>> {
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      // .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.auction', 'auction')
      .where('order.user = :userId', { userId });

    const config: PaginateConfig<Order> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return paginate<Order>(query, queryBuilder, config);
  }

  async findByIds(ids: number[]): Promise<Order[]> {
    return await this.repository.findByIds(ids);
  }

  async findById(id: number, relations: string[] = []): Promise<Order> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<Order> {
    return await this.repository.findOne(params);
  }

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.repository.preload({ id, ...dto });
    if (!order) {
      throw new NotFoundException(`order #${id} not found`);
    }
    return await this.repository.save(order);
  }

  // mark `isPaid` true
  async markItPaid(orderIds: number[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Order)
      .set({ isPaid: true })
      .where('id IN (:ids)', { ids: orderIds })
      .execute();
  }

  // mark `isPaid` false
  // make the payment void
  //
  // ** please note that nullifying paymentId will end up making
  // ** the payment record unusable. so, it'd be nicer to give
  // ** users an option to decide wether you want to nullify it
  // ** or not.
  async markItUnpaid(orderIds: number[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Order)
      .set({ isPaid: false, paymentId: null })
      .where('id IN (:ids)', { ids: orderIds })
      .execute();
  }

  async softRemove(id: number): Promise<Order> {
    const order = await this.findById(id);
    return await this.repository.softRemove(order);
  }

  async remove(id: number): Promise<Order> {
    const order = await this.findById(id);
    return await this.repository.remove(order);
  }
}
