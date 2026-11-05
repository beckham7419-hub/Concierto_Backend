import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './rol.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Rol])],
    exports: [TypeOrmModule],
})
export class RolesModule {}
