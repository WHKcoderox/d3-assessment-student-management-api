import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { StudentService } from './student.service';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    Repository
  ],
  providers: [StudentService]
})
export class StudentModule {}
