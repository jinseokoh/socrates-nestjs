import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import { S3 } from 'aws-sdk';
import * as Jimp from 'jimp';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { AWS_S3_CONNECTION } from 'src/common/constants';
import { CreateQuestionDto } from 'src/domain/questions/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/questions/dto/update-question.dto';
import { Question } from 'src/domain/questions/question.entity';
import { randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm';
@Injectable()
export class QuestionsService {
  constructor(
    @InjectSlack() private readonly slack: IncomingWebhook,
    @InjectRepository(Question)
    private readonly repository: Repository<Question>,
    @Inject(AWS_S3_CONNECTION)
    private readonly s3: S3,
  ) {}

  async create(dto: CreateQuestionDto): Promise<Question> {
    const question = this.repository.create(dto);
    return await this.repository.save(question);
  }

  async upload(
    id: number,
    files: Array<Express.Multer.File>,
  ): Promise<Question> {
    const images = [];

    // see if id is valid
    await this.findById(id);
    for (let i = 0; i < files.length; i++) {
      // image processing using Jimp
      const img = await Jimp.read(Buffer.from(files[i].buffer));
      const resizedImg = await img
        .resize(1280, Jimp.AUTO)
        .getBufferAsync(Jimp.MIME_JPEG); // file.mimetype
      const path = `local/questions/${id}/${randomName('question')}`;
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

    const message = `[v2] 사용자가 문의글 (#${id}) 을 남겼습니다.`;
    this.slack.send(message);

    return this.update(id, { images });
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Question>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: ['title', 'name'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        name: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Question> {
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

  async update(id: number, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.repository.preload({ id, ...dto });
    if (!question) {
      throw new NotFoundException(`question #${id} not found`);
    }
    return await this.repository.save(question);
  }

  async softRemove(id: number): Promise<Question> {
    const question = await this.findById(id);
    return await this.repository.softRemove(question);
  }

  async remove(id: number): Promise<Question> {
    const question = await this.findById(id);
    return await this.repository.remove(question);
  }
}
