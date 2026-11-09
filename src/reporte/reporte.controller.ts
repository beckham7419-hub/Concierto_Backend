import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decoradores.js';
import { ROL } from '../constantes.js';
import { FiltrosReporteDto } from './dto/filtros-reporte.dto.js';
import { ReporteService } from './reporte.service.js';

@Roles(ROL.ADMIN)
@Controller('reportes')
export class ReporteController {
    constructor(private readonly reporteService: ReporteService) {}

    @Get('conciertos')
    findAll(@Query() filtros: FiltrosReporteDto) {
        return this.reporteService.findAll(filtros);
    }

    @Get('conciertos/:id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reporteService.findOne(id);
    }
}
