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
import { Status } from 'src/common/enums';
import { Courier } from 'src/common/enums/courier';
import { OrderStatus } from 'src/common/enums/order-status';
import { OrderType } from 'src/common/enums/order-type';
import { TrackResult } from 'src/common/types/track-result.type';
import { Auction } from 'src/domain/auctions/auction.entity';
import { BioDto } from 'src/domain/orders/dto/bio-dto';
import { CreateOrderDto } from 'src/domain/orders/dto/create-order.dto';
import { UpdateOrderDto } from 'src/domain/orders/dto/update-order.dto';
import { Order } from 'src/domain/orders/order.entity';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
import { ShippingCostDto } from 'src/domain/payments/dto/shipping-cost.dto';
import { Payment } from 'src/domain/payments/payment.entity';
import {
  calcShippingCost,
  PACKING_PRICE,
} from 'src/helpers/calc-shipping-cost';
import { ShippingService } from 'src/services/shipping/shipping.service';
import { FindOneOptions, Repository } from 'typeorm';
import { BuyItNowDto } from './dto/buy-it-now.dto';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    private readonly shippingService: ShippingService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(auctionId: number): Promise<Order> {
    const auction = await this.auctionsRepository.findOneOrFail({
      where: { id: auctionId },
    });
    if (auction.status !== Status.ENDED) {
      throw new BadRequestException(`not ended yet`);
    }

    if (!auction.lastBidderId) {
      throw new BadRequestException(`no bidders`);
    }
    if (auction.lastBidAmount < auction.reservePrice) {
      throw new BadRequestException(`doesn't meet reserve price`);
    }

    const createOrderDto = new CreateOrderDto();
    createOrderDto.title = auction.title;
    createOrderDto.image = auction.images !== null ? auction.images[0] : null;
    createOrderDto.orderType = OrderType.AUCTION;
    createOrderDto.price = auction.lastBidAmount;
    createOrderDto.shipping = 0; // this hasn't fixed yet.
    createOrderDto.userId = auction.lastBidderId;
    createOrderDto.auctionId = auction.id;

    const order = this.repository.create(createOrderDto);
    return await this.repository.save(order);
  }

  async buyItNow(userId: number, dto: BuyItNowDto): Promise<Order> {
    const auction = await this.auctionsRepository.findOneOrFail({
      where: { id: dto.auctionId },
      relations: ['order'],
    });
    if (auction.status === Status.ENDED) {
      throw new BadRequestException(`already ended`);
    }
    if (auction.order) {
      throw new BadRequestException(`payment in process`);
    }

    const createOrderDto = new CreateOrderDto();
    createOrderDto.title = auction.title;
    createOrderDto.image = auction.images !== null ? auction.images[0] : null;
    createOrderDto.orderType = OrderType.BUYITNOW;
    createOrderDto.price = auction.buyItNowPrice;
    createOrderDto.shipping = 0;
    createOrderDto.userId = userId;
    createOrderDto.auctionId = auction.id;

    const order = this.repository.create(createOrderDto);
    const savedOrder = await this.repository.save(order);

    const createPaymentDto = new CreatePaymentDto();
    createPaymentDto.title = auction.title;
    createPaymentDto.priceSubtotal = auction.buyItNowPrice;
    createPaymentDto.shippingSubtotal = 0;
    createPaymentDto.shippingDiscount = 0;
    createPaymentDto.couponDiscount = 0;
    createPaymentDto.grandTotal = auction.buyItNowPrice;
    createPaymentDto.userId = userId;

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      orders: [savedOrder],
    });
    await this.paymentRepository.save(payment);

    return savedOrder;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Order 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Order>> {
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.auction', 'auction');

    const config: PaginateConfig<Order> = {
      sortableColumns: [
        'userId',
        'title',
        'orderStatus',
        'shippingStatus',
        'createdAt',
      ],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ],
        orderStatus: [FilterOperator.EQ],
        shippingStatus: [FilterOperator.EQ],
      },
      relations: ['payment'], // can be removed.
    };

    return paginate(query, queryBuilder, config);
  }

  // this is being used in user-orders.controller.ts
  async findAllByUserId(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Order>> {
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.auction', 'auction')
      .where('order.userId = :userId', { userId });

    const config: PaginateConfig<Order> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        orderStatus: [FilterOperator.EQ],
        shippingStatus: [FilterOperator.EQ],
      },
      relations: ['auction', 'payment'], // could be removed.
    };

    return paginate(query, queryBuilder, config);
  }

  async findByIds(ids: number[]): Promise<Order[]> {
    return await this.repository.findByIds(ids);
  }

  async findById(id: number, relations: string[] = []): Promise<Order> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Order> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.repository.preload({ id, ...dto });
    if (!order) {
      throw new NotFoundException(`entity not found`);
    }

    if (dto.trackingNumber) {
      console.log(order.userId, '~~~~ userId');

      // check out!!! this later.
      // if (!payment.trackingNumber) {
      //   const { pushToken } = await this.usersRepository.findOne({
      //     id: payment.userId,
      //   });
      //   const titles = payment.orders.map((i) => truncate(i.title, 10));
      //   const message =
      //     titles.length > 1
      //       ? `${titles.join(', ')} 작품들이 택배발송되었습니다.`
      //       : `${titles.join()} 작품이 택배발송되었습니다.`;

      //   await this.fcmService.sendNotification(
      //     pushToken,
      //     `[플리옥션]`,
      //     `"${message} ${dto.trackingNumber}`,
      //     {
      //       name: 'payment',
      //       id: `${id}`,
      //     },
      //   );
      // }
    }

    return await this.repository.save(order);
  }

  // what we need to do is as follows:
  // - set orderStatus to PAID
  // - set shipping
  // - set shippingComment
  // - set isCombined
  async updateAfterPayment(paymentId: number): Promise<void> {
    const payment = await this.paymentRepository.findOneOrFail({
      where: { id: paymentId },
      relations: ['orders', 'orders.auction', 'destination'],
    });
    const { reason, cost } = calcShippingCost(
      payment.destination?.country,
      payment.destination?.postalCode,
    );
    const orderCount = payment.orders.length;
    const noncombinableCount = payment.orders.filter(
      (v: Order) => !v.auction.isCombinable,
    ).length;
    const combinableCount = orderCount - noncombinableCount;
    const doubleBoxCount = Math.floor(combinableCount / 2);
    // const singleBoxCount = orderCount - doubleBoxCount * 2;
    const dto = new ShippingCostDto();
    dto.shippingSubtotal = orderCount * (cost + PACKING_PRICE);
    dto.shippingDiscount = doubleBoxCount * (cost + PACKING_PRICE);
    // console.log(orderCount, noncombinableCount, combinableCount);

    payment.orders
      .filter((v) => !v.auction.isCombinable)
      .map(async (order: Order) => {
        await this.repository
          .createQueryBuilder()
          .update(Order)
          .set({
            orderStatus: OrderStatus.PAID,
            shippingComment: `${reason} 단일배송`,
            isCombined: false,
            shipping: cost,
          })
          .where('id = :id', { id: order.id })
          .execute();
      });

    payment.orders
      .filter((v) => v.auction.isCombinable)
      .map(async (order: Order, i: number) => {
        console.log(i, combinableCount, combinableCount % 2);
        if (combinableCount % 2 > 0 && i === 0) {
          await this.repository
            .createQueryBuilder()
            .update(Order)
            .set({
              orderStatus: OrderStatus.PAID,
              shippingComment: `${reason} 단일배송`,
              isCombined: false,
              shipping: cost,
            })
            .where('id = :id', { id: order.id })
            .execute();
        } else {
          await this.repository
            .createQueryBuilder()
            .update(Order)
            .set({
              orderStatus: OrderStatus.PAID,
              shippingComment: `${reason} 묶음배송`,
              isCombined: true,
              shipping: cost / 2,
            })
            .where('id = :id', { id: order.id })
            .execute();
        }
      });
  }

  // this method is irreversible.
  // you have to call this if and only if user canceled the payment.
  async updateAfterCancellation(orderIds: number[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Order)
      .set({ orderStatus: OrderStatus.WAITING, paymentId: null })
      .where('id IN (:ids)', { ids: orderIds })
      .execute();
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Order> {
    const order = await this.findById(id);
    return await this.repository.remove(order);
  }

  async removeAll(id: number): Promise<Order> {
    const order = await this.findById(id, ['payment']);
    const payment = order.payment;

    if (order.orderType !== OrderType.BUYITNOW) {
      throw new BadRequestException(`order type mismatched`);
    }

    if (payment) {
      await this.paymentRepository.remove(payment);
    }

    return await this.repository.remove(order);
  }

  //--------------------------------------------------------------------------//
  // Some extra shit
  //--------------------------------------------------------------------------//

  async track(id: number): Promise<TrackResult> {
    const order = await this.repository.findOne({
      where: { id },
      relations: ['payment'],
    });

    if (order.courier === Courier.KDEXP) {
      return this.shippingService.checkKd(order.trackingNumber);
    }
    if (order.courier === Courier.EMS) {
      return this.shippingService.checkEms(order.trackingNumber);
    }
  }

  async checkBio(dto: BioDto): Promise<any> {
    return await this.shippingService.checkBio(dto);
  }
}
