import { IsObject } from 'class-validator';

export class UpdateGalleryContentDto {
  @IsObject()
  content: Record<string, any>;
}
