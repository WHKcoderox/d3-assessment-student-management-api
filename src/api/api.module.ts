import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { TeacherModule } from '../teacher/teacher.module';
import { StudentModule } from '../student/student.module';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';

@Module({
  imports: [TeacherModule, StudentModule],
  controllers: [ApiController],
  providers: [ApiService, StudentService, TeacherService],
})
export class ApiModule {}
