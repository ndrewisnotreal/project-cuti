import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/** Envelope error standar dari HttpExceptionFilter (`fail()`). */
export class ApiFailResponseDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Unauthorized' })
  error!: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  data!: unknown;
}

/** Envelope sukses standar (`ok()`). */
export class ApiOkResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ nullable: true, example: null })
  error!: string | null;

  @ApiProperty({ description: 'Payload sukses' })
  data!: T;
}

/** Response error umum (401/403/400) untuk endpoint protected. */
export function ApiStandardErrorResponses() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'JWT tidak valid / sesi hilang, atau x-api-key salah',
      type: ApiFailResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Tidak punya akses ke resource ini',
      type: ApiFailResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Validasi request gagal',
      type: ApiFailResponseDto,
    }),
  );
}

/**
 * Dokumentasikan response envelope `{ success, error, data }` dengan tipe `data`.
 * Pakai bersama `@ApiExtraModels(DataDto)` di controller jika `dataDto` dipakai.
 */
export function ApiOkEnvelope(
  dataDto?: Type<unknown>,
  options?: { description?: string; isArray?: boolean },
) {
  const dataSchema = dataDto
    ? options?.isArray
      ? { type: 'array' as const, items: { $ref: getSchemaPath(dataDto) } }
      : { $ref: getSchemaPath(dataDto) }
    : { type: 'object' as const, additionalProperties: true };

  const decorators = [
    ApiOkResponse({
      description: options?.description ?? 'Sukses',
      schema: {
        type: 'object',
        required: ['success', 'error', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          error: { type: 'string', nullable: true, example: null },
          data: dataSchema,
        },
      },
    }),
  ];

  if (dataDto) {
    decorators.unshift(ApiExtraModels(dataDto));
  }

  return applyDecorators(...decorators);
}
