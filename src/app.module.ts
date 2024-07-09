import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { ApiController } from './api/api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './teacher/teacher.entity';
import { Student } from './student/student.entity';
import { ApiService } from './api/api.service';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentService } from './student/student.service';
import { TeacherService } from './teacher/teacher.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}.local`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('TYPEORM_HOST'),
        port: configService.get('TYPEORM_PORT'),
        username: configService.get('TYPEORM_USERNAME'),
        password: configService.get('TYPEORM_PASSWORD'),
        database: configService.get('TYPEORM_DATABASE'),
        entities: [Teacher, Student],
        synchronize: configService.get('TYPEORM_SYNCHRONIZE') === 'true',
      })
    }),
    ApiModule,
    StudentModule,
    TeacherModule,
  ],
  controllers: [AppController, ApiController],
  providers: [AppService, ApiService, StudentService, TeacherService],
})
export class AppModule {}
