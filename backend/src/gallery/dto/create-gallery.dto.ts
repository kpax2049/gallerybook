import { IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  @IsOptional()
  content?: string;

  // TODO: define Image field
  // images: Image[]
}
