import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthorizeDto {
  @ApiProperty({ example: 'super', description: 'Username atau email seed QA' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Password seed (sesuaikan dengan DB)',
  })
  @IsString()
  @MinLength(4)
  password!: string;
}
