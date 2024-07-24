import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ICounts } from 'src/common/interfaces';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getVersion(): string {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  }

  async getCounts(): Promise<ICounts> {
    const result = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*) FROM user) as users,
        (SELECT COUNT(*) FROM meetup) as meetups,
        (SELECT COUNT(*) FROM poll) as polls,
        (SELECT COUNT(*) FROM feed) as feeds
    `);
    return {
      users: +result[0].users,
      meetups: +result[0].meetups,
      polls: +result[0].polls,
      feeds: +result[0].feeds,
    };
  }
}
