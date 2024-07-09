import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { ArrayContains, DataSource } from 'typeorm';

@Injectable()
export class StudentService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // Registers list of students specified by their emails to a teacher.
  async registerToTeacher(teacherEmail: string, studentEmails: string[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.dataSource
        .getRepository(Student)
        .createQueryBuilder('registerStudents', queryRunner)
        .relation(Student, "teachers")
        .of(studentEmails)
        .add(teacherEmail);
      
      await queryRunner.commitTransaction();
    } catch(e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        'message': 'Failed to register students. \
        Check that the emails provided are valid and present in the database \
        and that the students have not already been registered to the teachers.'
      });
    } finally {
      await queryRunner.release();
    }
  }
}
