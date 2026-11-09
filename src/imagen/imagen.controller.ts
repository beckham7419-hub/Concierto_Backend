import { Controller, Delete, FileTypeValidator, Get, Param, ParseFilePipe, ParseIntPipe, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Roles } from '../auth/decoradores.js';
import { IMAGEN_MAX_BYTES, IMAGEN_TIPOS, ROL } from '../constantes.js';
import { ImagenService } from './imagen.service.js';
import type { ArchivoSubido } from './imagen.service.js';

const OPCIONES_ARCHIVO = { defParamCharset: 'utf8', limits: { fileSize: IMAGEN_MAX_BYTES, files: 1, fields: 0 } };

const validarArchivo = () =>
    new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: IMAGEN_TIPOS, overrideMimeType: true })],
    });

@Controller('imagenes')
export class ImagenController {
    constructor(private readonly imagenService: ImagenService) {}

    @Roles(ROL.ADMIN)
    @Post()
    @UseInterceptors(FileInterceptor('archivo', OPCIONES_ARCHIVO))
    create(@UploadedFile(validarArchivo()) archivo: ArchivoSubido) {
        return this.imagenService.create(archivo);
    }

    @Public()
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.imagenService.findOne(id);
    }

    @Roles(ROL.ADMIN)
    @Put(':id')
    @UseInterceptors(FileInterceptor('archivo', OPCIONES_ARCHIVO))
    update(@Param('id', ParseIntPipe) id: number, @UploadedFile(validarArchivo()) archivo: ArchivoSubido) {
        return this.imagenService.update(id, archivo);
    }

    @Roles(ROL.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.imagenService.remove(id);
    }
}
