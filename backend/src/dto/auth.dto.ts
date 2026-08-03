import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  ACCOUNT_EMAIL_MAX_LENGTH,
  NormalizeEmail,
} from 'src/common/account-validation';

export class AuthDto {
  @NormalizeEmail()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;

  // @IsString()
  // firstName: string;

  // @IsString()
  // lastName: string;
}
