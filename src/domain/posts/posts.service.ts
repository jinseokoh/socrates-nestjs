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
import { CreatePostDto } from 'src/domain/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/domain/posts/dto/update-post.dto';
import { Post } from 'src/domain/posts/post.entity';
import { randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm';
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
    @Inject(AWS_S3_CONNECTION)
    private readonly s3: S3,
  ) {}

  async create(dto: CreatePostDto): Promise<Post> {
    const post = this.repository.create(dto);
    return await this.repository.save(post);
  }

  async upload(id: number, files: Array<Express.Multer.File>): Promise<Post> {
    const images = [];

    // see if id is valid
    await this.findById(id);
    for (let i = 0; i < files.length; i++) {
      // image processing using Jimp
      const img = await Jimp.read(Buffer.from(files[i].buffer));
      const resizedImg = await img
        .resize(1280, Jimp.AUTO)
        .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
      const path = `local/posts/${id}/${randomName('post')}`;
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

  async findAll(query: PaginateQuery): Promise<Paginated<Post>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isPublished: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Post> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const post = await this.repository.preload({ id, ...dto });
    if (!post) {
      throw new NotFoundException(`post #${id} not found`);
    }
    return await this.repository.save(post);
  }

  async softRemove(id: number): Promise<Post> {
    const post = await this.findById(id);
    return await this.repository.softRemove(post);
  }

  async remove(id: number): Promise<Post> {
    const post = await this.findById(id);
    return await this.repository.remove(post);
  }
}
