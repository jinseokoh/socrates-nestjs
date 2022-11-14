import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Iamport, Request } from 'iamport-rest-client-nodejs';
import {
  CertificationResponse,
  PaymentResponse,
} from 'iamport-rest-client-nodejs/dist/response';

@Injectable()
export class IamportService {
  private readonly iamport: Iamport;
  private readonly logger = new Logger(IamportService.name);
  constructor() {
    this.iamport = new Iamport({
      apiKey: process.env.IAMPORT_API_KEY,
      apiSecret: process.env.IAMPORT_API_SECRET,
    });
  }

  async getPaymentResponse(imp_uid: string): Promise<PaymentResponse> {
    const paymentRequest = Request.Payments;
    const result = paymentRequest.getByImpUid({ imp_uid });

    try {
      const { data } = await result.request(this.iamport);
      return data.response;
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'iamport-service');
      throw new BadRequestException(`iamport payment error`);
    }
  }

  async getCertificationResponse(
    imp_uid: string,
  ): Promise<CertificationResponse> {
    const certificationRequest = Request.Certifications;
    const result = certificationRequest.getCertification({ imp_uid });

    try {
      const { data } = await result.request(this.iamport);
      console.log(data);
      return data.response;
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'iamport-service');
      throw new BadRequestException(`iamport certification error`);
    }
  }
}
