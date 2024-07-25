import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignedUrl } from 'src/common/types';
import { Banner } from 'src/domain/banners/entities/banner.entity';
import { CreateBannerDto } from 'src/domain/banners/dto/create-banner.dto';
import { UpdateBannerDto } from 'src/domain/banners/dto/update-banner.dto';
import { randomImageName, randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly repository: Repository<Banner>,
    private readonly s3Service: S3Service,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateBannerDto): Promise<Banner> {
    return await this.repository.save(dto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  async findActive(): Promise<Banner[]> {
    return await this.repository
      .createQueryBuilder('banner')
      .where({
        isActive: true,
      })
      .getMany();
  }

  async findById(id: number, relations: string[] = []): Promise<Banner> {
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

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.repository.preload({ id, ...dto });
    if (!banner) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(banner);
  }

  // Banners image 갱신
  async upload(id: number, file: Express.Multer.File): Promise<Banner> {
    // see if id is valid
    await this.findById(id);
    const path = `${process.env.NODE_ENV}/banners/${id}/${randomName(
      'banner',
      file.mimetype,
    )}`;
    await this.s3Service.upload(file.buffer, path);
    // upload the manipulated image to S3
    // update banners table
    const image = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { image });
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  // note that this is hard-delete
  async remove(id: number): Promise<Banner> {
    const banner = await this.findById(id);
    return await this.repository.remove(banner);
  }

  //--------------------------------------------------------------------------//
  // Some extra endpoints
  //--------------------------------------------------------------------------//

  // s3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'banner', dto.mimeType);
    const path = `${process.env.NODE_ENV}/banners/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
