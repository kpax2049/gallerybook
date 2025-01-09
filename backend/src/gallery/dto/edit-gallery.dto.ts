import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EditGalleryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // TODO: define Image field
  // images: Image[]
}
