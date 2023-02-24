import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from 'src/domain/categories/categories.controller';
import { CategoriesService } from 'src/domain/categories/categories.service';
import { Category } from 'src/domain/categories/entities/category.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoriesService],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
