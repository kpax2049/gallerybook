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
} from 'class-validator';

export type SortKey =
  | 'updatedAt'
  | 'createdAt'
  | 'title'
  | 'views'
  | 'likes'
  | 'comments';
export type SortDir = 'asc' | 'desc';
export type GalleryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export class ListGalleriesDto {
  // Filtering
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
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
}
