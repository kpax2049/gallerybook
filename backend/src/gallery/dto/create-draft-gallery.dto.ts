import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDraftGalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  thumbnail?: any;
}
