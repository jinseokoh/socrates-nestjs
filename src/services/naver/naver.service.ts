import { AlimtalkClient, SmsClient } from '@nestjs-packages/ncp-sens';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class NaverService {
  constructor(
    @Inject(AlimtalkClient) private readonly alimtalkClient: AlimtalkClient,
    @Inject(SmsClient) private readonly smsClient: SmsClient,
  ) {}

  async sendAlimtalk(
    templateCode: string,
    to: string,
    content: string,
  ): Promise<void> {
    await this.alimtalkClient.send({
      templateCode,
      messages: [{ to, content }],
    });
  }

  async sendSms(data: { to: string; content: string }): Promise<void> {
    await this.smsClient.send(data);
  }
}
