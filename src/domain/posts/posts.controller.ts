import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as PostRequest,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePostDto } from 'src/domain/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/domain/posts/dto/update-post.dto';
import { Post } from 'src/domain/posts/post.entity';
import { PostsService } from 'src/domain/posts/posts.service';
import { multerOptions } from 'src/helpers/multer-options';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ description: '포스트 생성' })
  @PostRequest()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePostDto,
  ): Promise<Post> {
    return await this.postsService.create({ ...dto, userId });
  }

  @ApiOperation({ description: '포스트 이미지 생성 (최대 5장)' })
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  @PostRequest(':id/images')
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('id') id: number,
  ): Promise<Post> {
    return await this.postsService.upload(id, files);
  }

  @ApiOperation({ description: '포스트 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getPosts(@Paginate() query: PaginateQuery): Promise<Paginated<Post>> {
    return await this.postsService.findAll(query);
  }

  @ApiOperation({ description: '포스트 상세보기' })
  @Get(':id')
  async getPostById(@Param('id') id: number): Promise<Post> {
    return await this.postsService.findById(id, [
      'auction',
      'user',
      'postComments',
    ]);
  }

  @ApiOperation({ description: '포스트 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePostDto,
  ): Promise<Post> {
    return await this.postsService.update(id, dto);
  }

  @ApiOperation({ description: '포스트 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Post> {
    return await this.postsService.softRemove(id);
  }
}
