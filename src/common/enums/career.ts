export enum BaseCareer {
  STUDENT = 'student',
  ACCOUNTING = 'accounting',
  HR = 'hr',
  LEGAL = 'legal',
  STRATEGY = 'strategy',
  DESIGN = 'design',
  HARDWARE = 'hardware',
  DEV = 'dev',
  DEVGAME = 'devgame',
  DEVAI = 'devai',
  MARKETING = 'marketing',
  EDUCATION = 'education',
  BIO = 'bio',
  FINANCE = 'finance',
  COMMERCE = 'commerce',
  SALES = 'sales',
  MEDIA = 'media',
  ART = 'art',
  ATHLETE = 'athlete',
  FOOD = 'food',
  BEAUTY = 'beauty',
  CONSTRUCTION = 'construction',
  GOVERNMENT = 'government',
  ANIMAL = 'animal',
  WELFARE = 'welfare',
  OTHER = 'other',
}

export enum OptionalCareer {
  ALL = 'all',
}

export const TargetCareer = { ...BaseCareer, ...OptionalCareer };

export type TargetCareerType = BaseCareer | OptionalCareer;
