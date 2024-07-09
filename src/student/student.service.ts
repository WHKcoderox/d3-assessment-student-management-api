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
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager
        .createQueryBuilder()
        .relation(Student, "teachers")
        .of(studentEmails)
        .add(teacherEmail);
      await queryRunner.commitTransaction();
    } catch(e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        'message': 'Failed to register students. Check that the emails provided are valid and present in the database and that the students have not already been registered to the teachers.'
      });
    } finally {
      await queryRunner.release();
    }
  }

  async suspendStudent(student: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // since update does not 
      let validStudent = await queryRunner.manager
        .getRepository(Student)
        .exists({where: {email: student}});
      if (!validStudent) {
        throw new Error();
      }
      await queryRunner.manager
        .getRepository(Student)
        .update(student, { suspended : true });
      await queryRunner.commitTransaction();
    } catch(e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        'message': 'Failed to suspend student. Check that the email provided is valid and present in the database.'
      });
    } finally {
      await queryRunner.release();
    }
  }
}
