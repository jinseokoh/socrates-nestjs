import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProfileDto } from 'src/domain/profiles/dto/create-profile.dto';
import { UpdateProfileDto } from 'src/domain/profiles/dto/update-profile.dto';
import { Profile } from 'src/domain/profiles/profile.entity';
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
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async update(id: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.repository.preload({ id, ...dto });
    if (!profile) {
      throw new NotFoundException(`profile #${id} not found`);
    }
    return await this.repository.save(profile);
  }

  async remove(id: number): Promise<Profile> {
    const profile = await this.findById(id);
    return await this.repository.remove(profile);
  }
}
