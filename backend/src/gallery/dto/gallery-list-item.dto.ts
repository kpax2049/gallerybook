import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Visibility } from '@prisma/client'; // adjust if your enum lives elsewhere
import { AuthorSummaryDto } from './author-summary.dto';

export class GalleryListItemDto {
  @IsInt()
  id!: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnail?: string | null;

  @IsOptional()
  @IsInt()
  likesCount?: number;

  @IsOptional()
  @IsInt()
  favoritesCount?: number;

  @IsOptional()
  @IsInt()
  viewsCount?: number;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  tags?: string[];

  @IsEnum(Visibility)
  visibility!: Visibility;

  author!: AuthorSummaryDto;
}
