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
import { OrderStatus } from 'src/common/enums/order-status';
import { Destination } from 'src/domain/destinations/destination.entity';
import { Order } from 'src/domain/orders/order.entity';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
import { UpdatePaymentDto } from 'src/domain/payments/dto/update-payment.dto';
import { UpdateVbankDto } from 'src/domain/payments/dto/update-vbank.dto';
import { Payment } from 'src/domain/payments/payment.entity';
import { User } from 'src/domain/users/user.entity';
import {
  calcShippingCost,
  PACKING_PRICE,
} from 'src/helpers/calc-shipping-cost';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Repository } from 'typeorm';
import { Grant } from '../grants/grant.entity';
import { ShippingCostDto } from './dto/shipping-cost.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly fcmService: FcmService,
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
    @InjectRepository(Destination)
    private readonly destinationsRepository: Repository<Destination>,
    @InjectRepository(Grant)
    private readonly grantsRepository: Repository<Grant>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // payment 생성 (orderIds 로 지정한 상품들에 대하여 배송비 제외)
  async create(dto: CreatePaymentDto): Promise<Payment> {
    const orders = await this.ordersRepository.findByIds(dto.orderIds);
    if (orders.length < 1) {
      throw new NotFoundException(`entity not found`);
    }
    orders.forEach((order) => {
      if (order.userId !== dto.userId) {
        throw new BadRequestException(`doh! mind your id`);
      }
      if (order.paymentId) {
        throw new BadRequestException(`payment already exists`);
      }
      if (order.orderStatus === OrderStatus.PAID) {
        throw new BadRequestException(`already paid`);
      }
    });

    const priceSubtotal = orders.reduce((acc, cur) => acc + cur['price'], 0);
    const payment = this.repository.create({
      ...dto,
      orders,
      priceSubtotal,
      grandTotal: priceSubtotal,
    });

    return await this.repository.save(payment);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // payment 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Payment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.orders', 'order');

    const config: PaginateConfig<Payment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // payment 상세보기
  async findById(id: number, relations: string[] = []): Promise<Payment> {
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

  // payment w/ orders for IAMPORT webhooks
  async findByGivenId(paymentId: string): Promise<Payment> {
    const val = paymentId.replace('payment_', '');

    return await this.repository.findOne({
      where: { id: +val },
      relations: ['orders'],
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async _getShippingCost(
    paymentId: number,
    countryCode: string,
    postalCode: string,
  ): Promise<ShippingCostDto> {
    const payment = await this.repository.findOneOrFail({
      where: { id: paymentId },
      relations: ['orders', 'orders.auction'],
    });
    const { cost } = calcShippingCost(countryCode, postalCode);
    const orderCount = payment.orders.length;
    const noncombinableCount = payment.orders.filter(
      (order: Order) => !order.auction.isCombinable,
    ).length;
    const doubleBoxCount = Math.floor((orderCount - noncombinableCount) / 2);
    // const singleBoxCount = orderCount - doubleBoxCount;
    const dto = new ShippingCostDto();
    dto.shippingSubtotal = orderCount * (cost + PACKING_PRICE);
    dto.shippingDiscount = doubleBoxCount * (cost + PACKING_PRICE);

    return dto;
  }

  async _getCouponDiscount(grantId: number, userId: number): Promise<number> {
    const grant = await this.grantsRepository.findOneOrFail({
      where: { id: grantId },
      relations: ['coupon'],
    });
    if (userId !== grant.userId) {
      throw new BadRequestException(`coupon doesn't belong to me`);
    }
    if (!grant.coupon) {
      throw new NotFoundException('entity not found');
    }
    if (grant.coupon.expiredAt) {
      const now = new Date().getTime();
      const expiredAt = grant.coupon.expiredAt.getTime();
      if (now >= expiredAt) {
        throw new BadRequestException(`coupon expired`);
      }
    }
    if (grant.couponUsedAt) {
      throw new BadRequestException(`coupon already used`);
    }

    return grant.coupon.discount;
  }

  // this update method gathers destination and coupon info before
  // we step into the PG payment process.
  // - 1stly, updating shipping cost w/ destinationId
  // - 2ndly, updating coupon discount w/ grantId
  //
  // grandTotal, which user needs to pay, is equal to 1 + 2 - (3 + 4)
  // 1. priceSubtotal (sum of winning bid amount)
  // 2. shippingSubtotal (shipping cost depending on destination)
  // 3. shippingDiscount (saving amount w/ combined shipping if available)
  // 4. couponDiscount (saving amount w/ coupon if available)
  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.repository.preload({ id, ...dto });
    if (!payment) {
      throw new NotFoundException(`entity not found`);
    }

    if (dto.destinationId) {
      const destination = await this.destinationsRepository.findOne({
        id: dto.destinationId,
      });
      if (payment.userId !== destination.userId) {
        throw new BadRequestException(`address doesn't belong to me`);
      }
      const shippingCostDto = await this._getShippingCost(
        id,
        destination.country,
        destination.postalCode,
      );

      payment.shippingSubtotal = shippingCostDto.shippingSubtotal;
      payment.shippingDiscount = shippingCostDto.shippingDiscount;
      payment.destinationId = dto.destinationId;
    }

    if (dto.grantId) {
      const couponDiscount = await this._getCouponDiscount(
        dto.grantId,
        dto.userId,
      );
      payment.couponDiscount = couponDiscount;
      payment.grantId = dto.grantId;
    }

    payment.grandTotal =
      payment.priceSubtotal +
      payment.shippingSubtotal -
      (payment.shippingDiscount + payment.couponDiscount);
    return await this.repository.save(payment);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  // userId is required to prevent from deleting someone else's payment record
  async softRemove(paymentId: number, userId: number): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (payment.userId !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return await this.repository.softRemove(payment);
  }

  // userId is required to prevent from deleting someone else's payment record
  async remove(paymentId: number, userId: number): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (payment.userId !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return await this.repository.remove(payment);
  }

  //--------------------------------------------------------------------------//
  // some extra shit
  //--------------------------------------------------------------------------//

  // IAMPORT specific.
  // IAMPORT supports a range of payment methods. one of them is vbank.
  // when user chose to go with vbank option, we need to inform the user
  // vbank # once it's been issued for him/her. at least that's what
  // manual said.
  async vbank(id: number, dto: UpdateVbankDto): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { id },
    });
    if (!payment.paymentInfo) {
      const { pushToken } = await this.usersRepository.findOne({
        id: payment.userId,
      });

      await this.fcmService.sendNotification(
        pushToken,
        `[플리옥션]`,
        `${dto.paymentInfo}`,
        {
          name: 'payment',
          id: `${id}`,
        },
      );
    }

    const entity = await this.repository.preload({ id, ...dto });
    return await this.repository.save(entity);
  }
}
