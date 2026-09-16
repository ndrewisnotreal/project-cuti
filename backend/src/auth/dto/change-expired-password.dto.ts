import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeExpiredPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token dari response login PASSWORD_EXPIRED',
  })
  @IsString()
  @IsNotEmpty()
  change_token!: string;

  @ApiProperty({ example: 'NewPass1!' })
  @IsString()
  @MinLength(8)
  new_password!: string;

  @ApiProperty({ example: 'NewPass1!' })
  @IsString()
  @MinLength(8)
  confirm_password!: string;
}
