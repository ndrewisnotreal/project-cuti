import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { CreateHolidayDto, DeleteHolidayDto } from './dto/holiday.dto';
import { HolidayService } from './holiday.service';

@ApiTags('sicuti/holiday')
@ApiProtected()
@Controller('sicuti/holiday')
export class HolidayController {
  constructor(private readonly svc: HolidayService) {}

  @Get()
  @ApiOperation({ summary: 'List hari libur per tahun' })
  @ApiQuery({ name: 'year', required: false })
  @ApiOkResponse({ description: 'Daftar hari libur' })
  @ApiStandardErrorResponses()
  async findByYear(@Query('year') year?: string) {
    const y = year ? Number(year) : new Date().getFullYear();
    return ok(await this.svc.findByYear(y));
  }

  @Post()
  @ApiOperation({ summary: 'Tambah hari libur' })
  @ApiOkResponse({ description: 'Hari libur ditambah' })
  @ApiStandardErrorResponses()
  async create(@Body() dto: CreateHolidayDto) {
    return ok(await this.svc.create(dto));
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus hari libur (soft-delete)' })
  @ApiOkResponse({ description: 'Hari libur dihapus' })
  @ApiStandardErrorResponses()
  async remove(@Body() dto: DeleteHolidayDto) {
    await this.svc.remove(dto);
    return ok({ id_holiday: dto.id_holiday });
  }
}
