import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Credentials } from '@aws-sdk/types';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Jimp from 'jimp';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly credentials: Credentials;
  private readonly bucket: string;
  private readonly region: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.bucket = this.configService.get('aws.bucketName');
    this.region = configService.get('aws.defaultRegion');
    this.credentials = {
      accessKeyId: configService.get('aws.accessKey'),
      secretAccessKey: configService.get('aws.secretAccessKey'),
    };
    this.s3 = new S3Client({
      region: this.region,
      credentials: this.credentials,
    });
  }

  async upload(buffer: Buffer, path: string): Promise<any> {
    // image processing using Jimp
    const bucketParams = {
      Bucket: this.bucket,
      Body: buffer,
      Key: path,
      ACL: 'private',
    };
    // upload the manipulated image to S3
    const command = new PutObjectCommand(bucketParams);
    await this.s3.send(command);
  }

  async delete(path: string): Promise<any> {
    // image processing using Jimp
    const bucketParams = {
      Bucket: this.bucket,
      Key: path.replace(`${process.env.AWS_CLOUDFRONT_URL}/`, ''),
    };
    // upload the manipulated image to S3
    const command = new DeleteObjectCommand(bucketParams);
    await this.s3.send(command);
  }

  async uploadWithResizing(
    file: Express.Multer.File,
    path: string,
    size = 1280,
  ): Promise<any> {
    // image processing using Jimp
    const img = await Jimp.read(Buffer.from(file.buffer));
    const imgResized = await img
      .resize(size, Jimp.AUTO)
      .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
    const bucketParams = {
      Bucket: this.bucket,
      Body: imgResized,
      Key: path,
      ACL: 'private',
      ContentType: 'image/jpeg',
    };
    // upload the manipulated image to S3
    const command = new PutObjectCommand(bucketParams);
    await this.s3.send(command);
  }

  async generateUploadUrl(path: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: path,
    };
    const command = new GetObjectCommand(params);
    return await getSignedUrl(this.s3, command, {
      expiresIn: 60 * 2,
    });
  }

  async generatePresignedUrl(path: string): Promise<any> {
    const bucketParams = {
      Bucket: this.bucket,
      Key: path,
    };
    const command = new PutObjectCommand(bucketParams);
    const signedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 60 * 10,
    });
    // console.log(`key: "${bucketParams.Key}" bucket: "${bucketParams.Bucket}"`);

    return signedUrl;
  }
}
