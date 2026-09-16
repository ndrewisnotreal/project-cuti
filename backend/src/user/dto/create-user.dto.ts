import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'jdoe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  username!: string;

  @ApiPropertyOptional({ example: 'jdoe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  nama!: string;

  @ApiProperty({
    example: 'R0002',
    description: 'Kode role (tidak boleh lebih tinggi dari pemanggil)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  kd_role!: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({
    enum: ['A', 'N'],
    example: 'A',
    description: 'A=aktif, N=nonaktif',
  })
  @IsOptional()
  @IsIn(['A', 'N'])
  status?: string;
}
