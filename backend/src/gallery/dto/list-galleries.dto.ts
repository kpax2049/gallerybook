import { GalleryStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
  IsArray,
  ArrayUnique,
  IsEnum,
} from 'class-validator';

export type SortKey =
  | 'updatedAt'
  | 'createdAt'
  | 'title'
  | 'views'
  | 'likes'
  | 'comments';
export type SortDir = 'asc' | 'desc';

export class ListGalleriesDto {
  // Filtering
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return undefined;

    const arr = Array.isArray(value) ? value : String(value).split(',');
    const upper = arr
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean);

    const enumValues = Object.values(GalleryStatus) as string[]; // ['DRAFT','PUBLISHED','ARCHIVED']
    const isGalleryStatus = (x: string): x is GalleryStatus =>
      enumValues.includes(x);

    const norm = upper.filter(isGalleryStatus); // <- now typed as GalleryStatus[]
    // (optional) dedupe
    return Array.from(new Set(norm));
  })
  @IsEnum(GalleryStatus, { each: true })
  status?: GalleryStatus[];

  @IsOptional()
  @IsString()
  owner?: 'me' | 'any';

  @IsOptional()
  @IsString()
  @IsIn(['any', '7d', '30d', '90d'])
  range?: 'any' | '7d' | '30d' | '90d';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  hasCover?: boolean | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  hasTags?: boolean | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  hasComments?: boolean | null;

  // Tag slugs (preferred) or names
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  tags?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  // Sort
  @IsOptional()
  @IsString()
  @IsIn(['updatedAt', 'createdAt', 'title', 'views', 'likes', 'comments'])
  sortKey?: SortKey = 'updatedAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortDir?: SortDir = 'desc';

  // Pagination (page 1-based)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 24;

  // Whether to include my reactions in the response
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeMyReactions?: boolean = true;

  @IsOptional()
  @IsString()
  favoriteBy?: string; // "me" or a userId

  @IsOptional()
  @IsString()
  likedBy?: string; // "me" or a userId

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  followedOnly?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  createdById?: number;
}
