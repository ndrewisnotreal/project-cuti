import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentService } from './department.service';

@ApiTags('sicuti/department')
@ApiProtected()
@Controller('sicuti/department')
export class DepartmentController {
  constructor(private readonly svc: DepartmentService) {}

  @Get()
  @ApiOperation({ summary: 'List departemen' })
  @ApiQuery({ name: 'all', required: false })
  @ApiOkResponse({ description: 'Daftar departemen' })
  @ApiStandardErrorResponses()
  async findAll(@Query('all') all?: string) {
    return ok(await this.svc.findAll(all === 'true'));
  }

  @Post()
  @ApiOperation({ summary: 'Tambah departemen' })
  @ApiOkResponse({ description: 'Departemen dibuat' })
  @ApiStandardErrorResponses()
  async create(@Body() dto: CreateDepartmentDto) {
    return ok(await this.svc.create(dto));
  }

  @Put()
  @ApiOperation({ summary: 'Update departemen' })
  @ApiOkResponse({ description: 'Departemen diupdate' })
  @ApiStandardErrorResponses()
  async update(@Body() dto: UpdateDepartmentDto) {
    return ok(await this.svc.update(dto));
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus departemen (soft-delete)' })
  @ApiQuery({ name: 'kd_dept', required: true })
  @ApiOkResponse({ description: 'Departemen dihapus' })
  @ApiStandardErrorResponses()
  async remove(@Query('kd_dept') kdDept: string) {
    await this.svc.remove(kdDept);
    return ok({ kd_dept: kdDept });
  }
}
