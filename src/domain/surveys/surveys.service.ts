import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import * as Jimp from 'jimp';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { AnyData } from 'src/common/types/any-data.type';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { CreateArtworkDto } from 'src/domain/artworks/dto/create-artwork.dto';
import { UpdateArtworkDto } from 'src/domain/artworks/dto/update-artwork.dto';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class ArtworksService {
  constructor(
    @InjectSlack() private readonly slack: IncomingWebhook,
    @InjectRepository(Artwork)
    private readonly repository: Repository<Artwork>,
    @InjectRepository(Hashtag)
    private readonly hashtagsRepository: Repository<Hashtag>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Artwork 생성
  async create(
    dto: CreateArtworkDto,
    message: string | null = null,
  ): Promise<Artwork> {
    if (message) {
      this.slack.send(`[local-test] ${message}`);
    }
    const artwork = this.repository.create(dto);
    return await this.repository.save(artwork);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Artwork 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Artwork>> {
    const queryBuilder = this.repository
      .createQueryBuilder('artwork')
      .leftJoinAndSelect('artwork.artist', 'artist')
      .leftJoinAndSelect('artist.user', 'user');

    const config: PaginateConfig<Artwork> = {
      sortableColumns: [
        'id',
        'artistName',
        'title',
        'medium',
        'category',
        'color',
        'orientation',
        'size',
        'updatedAt',
      ],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        category: [FilterOperator.EQ],
        framing: [FilterOperator.EQ],
        condition: [FilterOperator.EQ],
        color: [FilterOperator.EQ],
        orientation: [FilterOperator.EQ],
        size: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // Artwork 상세보기
  async findById(id: number, relations: string[] = []): Promise<Artwork> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // Artwork 갱신
  async update(id: number, dto: UpdateArtworkDto): Promise<Artwork> {
    const artwork = await this.repository.preload({ id, ...dto });
    if (!artwork) {
      throw new NotFoundException(`entity not found`);
    }

    return await this.repository.save(artwork);
  }

  // Artwork 이미지 저장후 URL (string) 리턴
  async uploadImage(id: number, file: Express.Multer.File): Promise<AnyData> {
    const path = `local/artworks/${id}/${randomName('artwork', file.mimetype)}`;
    await this.s3Service.upload(file.buffer, path);

    return { data: `${process.env.AWS_CLOUDFRONT_URL}/${path}` };
  }

  // Artwork 이미지들 저장후 URLs (string[]) 리턴
  async uploadImages(
    id: number,
    files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    const artwork = await this.findById(id);
    const images = artwork.images ?? [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `local/artworks/${id}/${randomName(
        'artwork',
        file.mimetype,
      )}`;
      await this.s3Service.upload(file.buffer, path);
      images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);
    }

    return { data: images };
  }

  // ArtworkId 없이 Artwork 이미지 저장후  URLs (string[]) 리턴; Non-preferred way
  async uploadFiles(
    userId: number,
    files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `local/files/${userId}/${randomName(
        'artwork',
        file.mimetype,
      )}`;
      await this.s3Service.upload(file.buffer, path);
      images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);
    }

    return { data: images };
  }

  // Artwork 이미지 삭제
  async deleteImages(id: number, urls: Array<string>): Promise<Artwork> {
    const artwork = await this.findById(id);
    const images = artwork.images.filter((url) => {
      return !urls.includes(url);
    });
    if (artwork.images.length !== images.length) {
      artwork.images.map(async (url) => {
        if (urls.includes(url)) {
          await this.s3Service.delete(url);
        }
      });
      return this.update(id, { images });
    }

    throw new NotFoundException(`file not found`);
  }

  // Artwork 뷰잉룸 이미지 합성
  async composeImage(
    id: number,
    option: string,
    file: Express.Multer.File,
  ): Promise<AnyData> {
    let offsetX, offsetY, transparentBg;
    // validation check
    const artwork = await this.findById(id);
    const width = artwork.width;
    const height = artwork.height;
    if (width < 10 && height < 10) {
      throw new Error('fix the width and height first.');
    }
    // artwork width * ratio = 타겟의 가로 "픽셀" 사이즈 (bg1 의 경우, 600 pixels = 30cm 로 가정)
    const ratio = option === 'bg1' ? 2 / 3 : 5 / 6;
    const shadowOption =
      option === 'bg1'
        ? {
            opacity: 0.6,
            size: 1.0,
            blur: 2,
            x: 3,
            y: 3,
          }
        : {
            opacity: 0.6,
            size: 1.0,
            blur: 2,
            x: -3,
            y: 3,
          };
    // 배치에 필요한 x offset (좌로부터 얼마나 띄어야 하나?)
    const fnOffsetX =
      option === 'bg1'
        ? (width: number): number => (1000 - width) / 2
        : (width: number): number => (710 - width) / 2;
    // 배치에 필요한 y offset (위로부터 얼마나 띄어야 하나?)
    const fnOffsetY =
      option === 'bg1'
        ? (height: number): number => {
            const halfY = height / 2;
            const center = 254 + halfY;
            const offsetY = center - halfY * 1.2;
            return Math.round(offsetY);
          }
        : (height: number): number => 516 - height / 2;

    // image processing using Jimp
    const img = await Jimp.read(Buffer.from(file.buffer));
    const targetPixelSize = Math.floor(width * ratio);
    const intermediateImg = await img.resize(
      targetPixelSize,
      Jimp.AUTO,
      (err, image) => {
        if (err) {
          console.log('error', err);
        }
        const bitmapWidth = image.bitmap.width;
        const bitmapHeight = image.bitmap.height;
        offsetX = fnOffsetX(bitmapWidth);
        offsetY = fnOffsetY(bitmapHeight);
        transparentBg = new Jimp(bitmapWidth + 20, bitmapHeight + 20, 0x0);
      },
    );
    const intermediateImgWithShadow = transparentBg
      .composite(intermediateImg, 10, 10)
      .shadow(shadowOption);
    const bg = await Jimp.read(`assets/${option}/bg.png`);
    const obj = await Jimp.read(`assets/${option}/object.png`);

    const finalImg = await bg
      .composite(intermediateImgWithShadow, offsetX, offsetY)
      .composite(obj, 0, 0)
      .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
    const path = `local/artworks/${id}/${randomName('composite')}`;
    await this.s3Service.upload(finalImg, path);

    return { data: `${process.env.AWS_CLOUDFRONT_URL}/${path}` };
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Artwork> {
    const artwork = await this.findById(id);
    return await this.repository.softRemove(artwork);
  }

  async remove(id: number): Promise<Artwork> {
    const artwork = await this.findById(id);
    return await this.repository.remove(artwork);
  }

  //--------------------------------------------------------------------------//
  // Some extra endpoints
  //--------------------------------------------------------------------------//

  async getPresignedUrls(
    userId: number,
    files: Array<Express.Multer.File>,
  ): Promise<Array<string>> {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `local/files/${userId}/${randomName(
        'artwork',
        file.mimetype,
      )}`;
      const url = await this.s3Service.generatePresignedUrl(path);
      urls.push(url);
    }
    return urls;
  }

  //--------------------------------------------------------------------------//
  // Hashtag related endpoints
  //--------------------------------------------------------------------------//

  async syncHashtags(id: number, keys: string[]): Promise<Artwork> {
    const artwork = await this.findById(id);
    const artworkHashtags = await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'hashtags')
      .of(artwork)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'hashtags')
      .of(artwork)
      .remove(artworkHashtags);

    if (keys.length < 1) {
      return artwork;
    }

    const parents = keys
      .filter((v) => !v.startsWith('0'))
      .map((v) => {
        const parts = v.split('-');
        return `0-${parts[0]}`;
      });

    const items = [...keys, ...parents];
    console.log('~~~~~~~~~~~~~~~~~~~~~');
    console.log(keys, parents, items);
    console.log('~~~~~~~~~~~~~~~~~~~~~');
    const itemsWithParents = [...new Set([...keys, ...parents])];
    const conditions = items.map((v) => {
      return { key: v };
    });
    const hashtags = await this.hashtagsRepository.find({
      where: conditions,
    });
    artwork.hashtags = hashtags;
    return await this.repository.save(artwork);
  }

  async attachHashtag(artworkId: number, hashtagId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `hashtag_artwork` (artworkId, hashtagId) VALUES (?, ?)',
      [artworkId, hashtagId],
    );
  }

  async detachHashtag(artworkId: number, hashtagId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `hashtag_artwork` WHERE artworkId = ? AND hashtagId = ?',
      [artworkId, hashtagId],
    );
  }
}
