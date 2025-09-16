import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class AuthorSummaryDto {
  @IsInt()
  id!: number;

  @IsString()
  username!: string;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsUrl()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  slug?: string | null;
}
