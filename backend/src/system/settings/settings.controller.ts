import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { DeleteSettingsDto } from './dto/delete-settings.dto';
import { UpsertThemeDto } from './dto/upsert-theme.dto';
import { SettingsService } from './settings.service';

type MultipartPayload = {
  nm_settings?: string;
  kode?: string;
  id_settings?: string;
  value?: string;
  fileBuffer?: Buffer;
  filename?: string;
};

@ApiTags('system/settings')
@ApiProtected()
@Controller('system/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List website settings' })
  @ApiOkResponse({ description: 'Daftar settings' })
  @ApiStandardErrorResponses()
  async findAll() {
    return ok(await this.settingsService.findAll());
  }

  @Put('theme')
  @ApiOperation({
    summary: 'Upsert tema UI global (primary, surface, preset, menuMode)',
  })
  @ApiOkResponse({ description: 'Tema disimpan' })
  @ApiStandardErrorResponses()
  async upsertTheme(@Body() dto: UpsertThemeDto) {
    return ok(await this.settingsService.upsertTheme(dto));
  }

  @Get(':id')
  @ApiParam({ name: 'id', example: 'ST001', description: 'ID settings' })
  @ApiOperation({ summary: 'Ambil satu website setting by id' })
  @ApiOkResponse({ description: 'Detail setting' })
  @ApiStandardErrorResponses()
  async findOne(@Param('id') id: string) {
    return ok(await this.settingsService.findById(id));
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form multipart: metadata + file di field `value`',
    schema: {
      type: 'object',
      required: ['kode', 'value'],
      properties: {
        nm_settings: {
          type: 'string',
          example: 'Logo Aplikasi',
          description: 'Nama tampilan setting',
        },
        kode: {
          type: 'string',
          example: 'logo',
          description: 'Kode unik setting',
        },
        value: {
          type: 'string',
          format: 'binary',
          description: 'File yang diupload',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Buat website setting (multipart: nm_settings, kode, value file)',
  })
  @ApiOkResponse({ description: 'Setting dibuat' })
  @ApiStandardErrorResponses()
  async create(@Req() req: FastifyRequest) {
    const payload = await this.parseMultipart(req);
    if (!payload.fileBuffer) {
      throw new BadRequestException('File Settings tidak boleh kosong.');
    }
    if (!payload.kode) {
      throw new BadRequestException('Kode Settings tidak boleh kosong.');
    }
    const publicUrl = await this.settingsService.uploadSettingsFile(
      payload.fileBuffer,
      payload.kode,
      payload.filename || payload.kode,
    );
    const row = await this.settingsService.create({
      nm_settings: payload.nm_settings || '',
      kode: payload.kode,
      value: publicUrl,
    });
    return ok(row);
  }

  @Put()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form multipart; file `value` opsional saat update',
    schema: {
      type: 'object',
      required: ['id_settings', 'kode'],
      properties: {
        id_settings: {
          type: 'string',
          example: 'ST001',
          description: 'ID settings yang diupdate',
        },
        nm_settings: {
          type: 'string',
          example: 'Logo Aplikasi',
        },
        kode: {
          type: 'string',
          example: 'logo',
        },
        value: {
          type: 'string',
          format: 'binary',
          description: 'File baru (opsional)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Update website setting (multipart; file value opsional)',
  })
  @ApiOkResponse({ description: 'Setting diupdate' })
  @ApiStandardErrorResponses()
  async update(@Req() req: FastifyRequest) {
    const payload = await this.parseMultipart(req);
    if (!payload.id_settings) {
      throw new BadRequestException('ID Settings tidak boleh kosong.');
    }
    if (!payload.kode) {
      throw new BadRequestException('Kode Settings tidak boleh kosong.');
    }

    let value: string | undefined;
    if (payload.fileBuffer) {
      value = await this.settingsService.uploadSettingsFile(
        payload.fileBuffer,
        payload.kode,
        payload.filename || payload.kode,
      );
    }

    const row = await this.settingsService.update({
      id_settings: payload.id_settings,
      nm_settings: payload.nm_settings || '',
      kode: payload.kode,
      value,
    });
    return ok(row);
  }

  @Delete()
  @ApiOperation({ summary: 'Soft-delete website setting' })
  @ApiOkResponse({ description: 'Setting di-soft-delete' })
  @ApiStandardErrorResponses()
  async remove(@Body() dto: DeleteSettingsDto) {
    return ok(await this.settingsService.remove(dto.id_settings));
  }

  private async parseMultipart(req: FastifyRequest): Promise<MultipartPayload> {
    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.includes('multipart/form-data')) {
      throw new BadRequestException('Content-Type harus multipart/form-data');
    }

    const payload: MultipartPayload = {};
    const parts = req.parts();

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'value') {
        payload.fileBuffer = await part.toBuffer();
        payload.filename = part.filename;
      } else if (part.type === 'field') {
        const raw = (part as { value?: unknown }).value;
        const val = typeof raw === 'string' ? raw : '';
        if (part.fieldname === 'nm_settings') payload.nm_settings = val;
        else if (part.fieldname === 'kode') payload.kode = val;
        else if (part.fieldname === 'id_settings') payload.id_settings = val;
        else if (part.fieldname === 'value') payload.value = val;
      }
    }

    return payload;
  }
}
