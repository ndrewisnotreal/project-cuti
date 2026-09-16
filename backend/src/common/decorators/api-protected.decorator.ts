import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/** Wire JWT Bearer + x-api-key ke operasi Swagger (Authorize → Try it out). */
export function ApiProtected() {
  return applyDecorators(ApiBearerAuth('bearer'), ApiSecurity('x-api-key'));
}
