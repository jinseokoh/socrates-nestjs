import { Logger, QueryRunner } from 'typeorm';

export class CustomLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    console.log('Query:', query);
    if (parameters && parameters.length) {
      console.log('Parameters:', parameters);
    }
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    console.error('Query Error:', error);
    console.error('Query:', query);
    if (parameters && parameters.length) {
      console.error('Parameters:', parameters);
    }
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    console.warn('Query is slow:', time);
    console.warn('Query:', query);
    if (parameters && parameters.length) {
      console.warn('Parameters:', parameters);
    }
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    console.log('Schema build:', message);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    console.log('Migration:', message);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    if (level === 'log') {
      console.log(message);
    } else if (level === 'info') {
      console.info(message);
    } else if (level === 'warn') {
      console.warn(message);
    }
  }
}
