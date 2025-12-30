import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'haslo123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'haslo123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}


