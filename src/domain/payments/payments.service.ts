import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Iamport, Request } from 'iamport-rest-client-nodejs';
import { PaymentResponse } from 'iamport-rest-client-nodejs/dist/response';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Order } from 'src/domain/orders/order.entity';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
import { TrackingNumberDto } from 'src/domain/payments/dto/tracking-number.dto';
import { UpdatePaymentDto } from 'src/domain/payments/dto/update-payment.dto';
import { Payment } from 'src/domain/payments/payment.entity';
import { User } from 'src/domain/users/user.entity';
import { truncate } from 'src/helpers/truncate';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Repository } from 'typeorm';
import { Grant } from '../grants/grant.entity';
import { IamportPaymentDto } from './dto/iamport-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly fcmService: FcmService,
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Grant)
    private readonly grantsRepository: Repository<Grant>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const orders = await this.ordersRepository.findByIds(dto.orderIds);
    if (orders.length < 1) {
      throw new NotFoundException(`orders not found`);
    }
    orders.forEach((order) => {
      if (order.paymentId) {
        throw new BadRequestException(`payment bill exists`);
      }
      if (order.isPaid) {
        throw new BadRequestException(`already paid`);
      }
    });

    const priceSubTotal = orders.reduce((acc, cur) => acc + cur['price'], 0);
    const deliverySubTotal = orders.reduce(
      (acc, cur) => acc + cur['deliveryFee'],
      0,
    );
    const total = priceSubTotal + deliverySubTotal;
    const payment = this.repository.create({
      ...dto,
      orders,
      priceSubTotal,
      deliverySubTotal,
      total,
      grandTotal: total,
    });

    return await this.repository.save(payment);
  }

  async findAll(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Payment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.orders', 'order')
      .where('order.user = :userId', { userId });

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

  async findById(id: number, relations: string[] = []): Promise<Payment> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  // returns payment w/ orders
  async findByGivenId(paymentId: string): Promise<Payment> {
    const val = paymentId.replace('payment_', '');

    return await this.repository.findOne({
      where: { id: +val },
      relations: ['orders'],
    });
  }

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  async track(id: number, dto: TrackingNumberDto): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { id },
      relations: ['orders'],
    });
    if (!payment.trackingNumber) {
      const { pushToken } = await this.userRepository.findOne({
        id: payment.userId,
      });
      const titles = payment.orders.map((i) => truncate(i.title, 10));
      const message =
        titles.length > 1
          ? `${titles.join(', ')} 작품들이 택배발송되었습니다.`
          : `${titles.join()} 작품이 택배발송되었습니다.`;
      await this.fcmService.sendNotification(
        pushToken,
        `[플리옥션]`,
        `"${message} ${dto.trackingNumber}`,
        {
          name: 'payment',
          id: `${id}`,
        },
      );
    }

    const entity = await this.repository.preload({ id, ...dto });
    return await this.repository.save(entity);
  }

  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.repository.preload({ id, ...dto });
    if (!payment) {
      throw new NotFoundException(`payment #${id} not found`);
    }

    if (payment.grantId) {
      const grant = await this.grantsRepository.findOne({
        id: payment.grantId,
      });
      if (payment.userId !== grant.userId) {
        throw new BadRequestException(`coupon ownership error`);
      }
    }

    payment.grandTotal = payment.total - payment.discount;
    return await this.repository.save(payment);
  }

  async softRemove(id: number): Promise<Payment> {
    const payment = await this.findById(id);
    return await this.repository.softRemove(payment);
  }

  async remove(id: number): Promise<Payment> {
    const payment = await this.findById(id);
    return await this.repository.remove(payment);
  }

  async verify(dto: IamportPaymentDto): Promise<PaymentResponse> {
    const iamport = new Iamport({
      apiKey: process.env.IAMPORT_API_KEY,
      apiSecret: process.env.IAMPORT_API_SECRET,
    });
    const { Payments } = Request;
    const paymentByImpUid = Payments.getByImpUid({
      imp_uid: dto.imp_uid,
    });

    let result;
    try {
      result = await paymentByImpUid.request(iamport);
    } catch (e) {
      throw new BadRequestException(`IAMPORT API error`);
    }

    return result.data.response;
  }
}
