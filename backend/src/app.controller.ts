import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { ok } from './common/response.util';

@ApiTags('health')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Service hidup',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        error: { type: 'string', nullable: true, example: null },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'up' },
            timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  health() {
    return ok({ status: 'up', timestamp: new Date().toISOString() });
  }
}
