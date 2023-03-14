import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProfileDto } from 'src/domain/users/dto/create-profile.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly repository: Repository<Profile>,
  ) {}

  async create(dto: CreateProfileDto): Promise<Profile> {
    const profile = this.repository.create(dto);
    return await this.repository.save(profile);
  }

  async findById(id: number, relations: string[] = []): Promise<Profile> {
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

  async update(id: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.repository.preload({ id, ...dto });
    if (!profile) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(profile);
  }

  async remove(id: number): Promise<Profile> {
    const profile = await this.findById(id);
    return await this.repository.remove(profile);
  }
}
