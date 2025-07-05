import { IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @IsUrl()
  avatarUrl: string;
}
