import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule} from '@nestjs/typeorm'
import { RolesModule } from './roles/roles.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';
import { SeedModule } from './seed/seed.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EstadoModule } from './estado/estado.module.js';
import { CiudadModule } from './ciudad/ciudad.module.js';
import { GeneroModule } from './genero/genero.module.js';
import { MetodoPagoModule } from './metodo-pago/metodo-pago.module.js';
import { ArtistaModule } from './artista/artista.module.js';
import { RecintoModule } from './recinto/recinto.module.js';
import { ZonaModule } from './zona/zona.module.js';
import { ConciertoModule } from './concierto/concierto.module.js';
import { CarteleraModule } from './cartelera/cartelera.module.js';
import { TicketModule } from './ticket/ticket.module.js';
import { PagoModule } from './pago/pago.module.js';
import { ImagenModule } from './imagen/imagen.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal : true}),
    TypeOrmModule.forRoot({
      type : "mysql",
      host : process.env.DB_HOST,
      port : Number(process.env.DB_PORT),
      username : process.env.DB_USERNAME,
      password : process.env.DB_PASSWORD,
      database : process.env.DB_DATABASE,
      autoLoadEntities : true,
      synchronize : process.env.DB_SYNC === 'true'
    }),
    RolesModule,
    UsuarioModule,
    SeedModule,
    AuthModule,
    EstadoModule,
    CiudadModule,
    GeneroModule,
    MetodoPagoModule,
    ArtistaModule,
    RecintoModule,
    ZonaModule,
    ConciertoModule,
    CarteleraModule,
    TicketModule,
    PagoModule,
    ImagenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
