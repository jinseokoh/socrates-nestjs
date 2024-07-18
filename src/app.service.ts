import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
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

  async getCounts(): Promise<{
    users: number;
    meetups: number;
    polls: number;
    connections: number;
  }> {
    const result = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*) FROM user) as users,
        (SELECT COUNT(*) FROM meetup) as meetups,
        (SELECT COUNT(*) FROM poll) as polls,
        (SELECT COUNT(*) FROM connection) as connections
    `);
    return {
      users: +result[0].users,
      meetups: +result[0].meetups,
      polls: +result[0].polls,
      connections: +result[0].connections,
    };
  }
}
