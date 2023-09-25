import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
} from '@aws-sdk/client-ses';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SesService {
  private readonly ses: SESClient;
  private readonly region: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.region = this.configService.get('aws.defaultRegion');
    // note that we don't, in fact, have to embed the credentials the way i did
    // in the following line. AWS library will pick them up from environment
    // variables automatically. (edit: removed the credentials part)
    // refer @https://stackoverflow.com/questions/68264237/how-to-set-credentials-in-aws-sdk-v3-javascript
    this.ses = new SESClient({
      region: this.region,
    });
  }

  async sendEmail(toAddress: string, fromAddress: string): Promise<any> {
    const sendEmailCommand = this.createSendEmailCommand(
      toAddress,
      fromAddress,
    );
    try {
      await this.ses.send(sendEmailCommand);
    } catch (e) {
      throw new BadRequestException('aws-ses error');
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<any> {
    const sendEmailCommand = this.createSendOtpTemplatedEmailCommand(
      email,
      otp,
    );
    try {
      await this.ses.send(sendEmailCommand);
    } catch (e) {
      throw new BadRequestException('aws-ses error');
    }
  }

  //?-------------------------------------------------------------------------//
  //? Privates)
  //?-------------------------------------------------------------------------//

  createSendEmailCommand = (toAddress: string, fromAddress: string) => {
    return new SendEmailCommand({
      Destination: {
        /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: [
          toAddress,
          /* more To-email addresses */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: 'HTML_FORMAT_BODY',
          },
          Text: {
            Charset: 'UTF-8',
            Data: 'TEXT_FORMAT_BODY',
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'EMAIL_SUBJECT',
        },
      },
      Source: fromAddress,
      ReplyToAddresses: [
        /* more items */
      ],
    });
  };

  createSendOtpTemplatedEmailCommand = (email: string, otp: string) => {
    return new SendTemplatedEmailCommand({
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      TemplateData: JSON.stringify({ code: otp }),
      Source: 'MeSo <no-reply@mesoapp.kr>',
      Template: `EmailCodeTemplate`,
    });
  };
}
