import { AWSOptions, BaseProvider } from '@adminjs/upload';
import { S3 } from '@aws-sdk/client-s3';
import { UploadedFile } from 'adminjs';
import * as Jimp from 'jimp';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// ref) https://github.com/SoftwareBrothers/adminjs/issues/95
export class AvatarProvider extends BaseProvider {
  private readonly s3;
  constructor(private readonly options: AWSOptions) {
    super(options.bucket);
    this.s3 = new S3({
      region: options.region,
    });
  }
  public async upload(file: UploadedFile, key: string): Promise<any> {
    // image processing using Jimp
    const img = await Jimp.read(file.path);
    const imgResized = await img
      .resize(640, Jimp.AUTO)
      .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
    const path = key.replace(`${process.env.AWS_CLOUDFRONT_URL}/`, '');
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: imgResized,
      Key: path,
      ACL: 'private',
      ContentType: 'image/jpeg',
    };
    // upload the manipulated image to S3
    await this.s3.putObject(params);
  }

  public async delete(key: string, bucket: string): Promise<any> {
    //await fs.promises.unlink(this.path(key, bucket));
  }

  // eslint-disable-next-line class-methods-use-this
  public async path(key: string, bucket?: string): Promise<string> {
    return key;
  }
}
