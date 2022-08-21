import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import * as Jimp from 'jimp';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AWS_S3_CONNECTION } from 'src/common/constants';
import { Availability } from 'src/common/enums/availability';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { CreateArtworkDto } from 'src/domain/artworks/dto/create-artwork.dto';
import { SyncArtworkHashtagsDto } from 'src/domain/artworks/dto/sync-artwork-hashtags.dto';
import { SyncArtworkUsersDto } from 'src/domain/artworks/dto/sync-artwork-users.dto';
import { UpdateArtworkDto } from 'src/domain/artworks/dto/update-artwork.dto';
import { User } from 'src/domain/users/user.entity';
import { randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork)
    private readonly repository: Repository<Artwork>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(AWS_S3_CONNECTION)
    private readonly s3: S3,
  ) {}

  async create(dto: CreateArtworkDto): Promise<Artwork> {
    const artwork = this.repository.create(dto);
    return await this.repository.save(artwork);
  }

  async upload(
    id: number,
    files: Array<Express.Multer.File>,
  ): Promise<Artwork> {
    const images = [];

    // see if id is valid
    await this.findById(id);
    for (let i = 0; i < files.length; i++) {
      // image processing using Jimp
      const img = await Jimp.read(Buffer.from(files[i].buffer));
      const resizedImg = await img
        .resize(1280, Jimp.AUTO)
        .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
      const path = `local/artworks/${id}/${randomName('artwork')}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: resizedImg,
        Key: path,
        ACL: 'private',
        ContentType: 'image/jpeg',
      };
      // upload the manipulated image to S3
      await this.s3.putObject(params);
      images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);
    }

    return this.update(id, { images });
  }

  async composite(id: number, file: Express.Multer.File): Promise<Artwork> {
    let offsetX, offsetY, transparentBg;
    const calcOffsetX = (width: number): number => {
      return (3000 - width) / 2;
    };
    const calcOffsetY = (height: number): number => {
      const halfY = height / 2;
      const center = 760 + halfY;
      const offsetY = center - halfY * 1.2;
      return Math.round(offsetY);
    };

    // see if id is valid
    const artwork = await this.findById(id);
    // image processing using Jimp
    const img = await Jimp.read(Buffer.from(file.buffer));
    const tempSize = artwork.width ? artwork.width * 15 : 30 * 25;
    const intermediateImg = await img.resize(
      tempSize,
      Jimp.AUTO,
      (err, image) => {
        if (err) {
          console.log('dang.', err);
        }
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        offsetX = calcOffsetX(w);
        offsetY = calcOffsetY(h);
        transparentBg = new Jimp(w + 20, h + 20, 0x0);
      },
    );
    const intermediateImgWithShadow = transparentBg
      .composite(intermediateImg, 0, 0)
      .shadow({
        opacity: 0.3,
        size: 1.0,
        x: 10,
        y: 10,
        blur: 5,
      });
    const girl = await Jimp.read('assets/bgs/girl.png');
    const bg = await Jimp.read('assets/bgs/bg.png');

    const finalImg = await bg
      .composite(intermediateImgWithShadow, offsetX, offsetY)
      .composite(girl, 0, 0)
      .resize(1280, Jimp.AUTO)
      .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
    const path = `local/artworks/${id}/${randomName('artwork')}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: finalImg,
      Key: path,
      ACL: 'private',
      ContentType: 'image/jpeg',
    };
    console.log(params);
    // upload the manipulated image to S3
    await this.s3.putObject(params);
    // update artworks table
    const images = artwork.images ?? [];
    images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);

    return this.update(id, { images });
  }

  async increase(id: number): Promise<any> {
    return await this.repository
      .createQueryBuilder()
      .update(Artwork)
      .where('id = :id', { id })
      .set({ viewCount: () => 'viewCount + 1' })
      .execute();
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Artwork>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title', 'price'],
      searchableColumns: ['title', 'subtitle', 'body', 'medium'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        price: [FilterOperator.GTE, FilterOperator.LTE],
        availability: [FilterOperator.EQ],
        category: [FilterOperator.EQ],
        color: [FilterOperator.EQ],
        framing: [FilterOperator.EQ],
        orientation: [FilterOperator.EQ],
        size: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Artwork> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async count(artistId: number, title: string): Promise<number> {
    return await this.repository.count({
      where: {
        artistId,
        title,
      },
    });
  }

  async update(id: number, dto: UpdateArtworkDto): Promise<Artwork> {
    const artwork = await this.repository.preload({ id, ...dto });
    if (!artwork) {
      throw new NotFoundException(`artwork #${id} not found`);
    }
    return await this.repository.save(artwork);
  }

  async markItSold(orderIds: number[]): Promise<any> {
    return await this.repository.manager.query(
      'UPDATE `order` LEFT JOIN `auction` \
ON `order`.auctionId = `auction`.id \
LEFT JOIN `artwork` \
ON `auction`.artworkId = `artwork`.id \
SET `artwork`.availability = ? \
WHERE `order`.id IN (?)',
      [Availability.SOLD, orderIds],
    );
  }

  async markItUnknown(orderIds: number[]): Promise<any> {
    return await this.repository.manager.query(
      'UPDATE `order` LEFT JOIN `auction` \
ON `order`.auctionId = `auction`.id \
LEFT JOIN `artwork` \
ON `auction`.artworkId = `artwork`.id \
SET `artwork`.availability = ? \
WHERE `order`.id IN (?)',
      [Availability.UNKNOWN, orderIds],
    );
  }

  async softRemove(id: number): Promise<Artwork> {
    const artwork = await this.findById(id);
    return await this.repository.softRemove(artwork);
  }

  async remove(id: number): Promise<Artwork> {
    const artwork = await this.findById(id);
    return await this.repository.remove(artwork);
  }

  //** extras

  async syncUsers(id: number, dto: SyncArtworkUsersDto): Promise<Artwork> {
    const artwork = await this.findById(id);
    const artworkUsers = await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'users')
      .of(artwork)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'users')
      .of(artwork)
      .remove(artworkUsers);

    const users = await this.usersRepository.findByIds(dto.ids);
    artwork.users = users;
    return await this.repository.save(artwork);
  }

  async attachUser(artworkId: number, userId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `artwork_user_like` (artworkId, userId) VALUES (?, ?)',
      [artworkId, userId],
    );
  }

  async detachUser(artworkId: number, userId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `artwork_user_like` WHERE artworkId = ? AND userId = ?',
      [artworkId, userId],
    );
  }

  async syncHashtags(
    id: number,
    dto: SyncArtworkHashtagsDto,
  ): Promise<Artwork> {
    const artwork = await this.findById(id);
    const artworkHashtags = await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'users')
      .of(artwork)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Artwork, 'users')
      .of(artwork)
      .remove(artworkHashtags);

    const users = await this.usersRepository.findByIds(dto.ids);
    artwork.users = users;
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
