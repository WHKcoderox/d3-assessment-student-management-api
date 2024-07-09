import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { DataSource, In } from 'typeorm';
import emailRegexSafe = require('email-regex-safe');
import { Teacher } from '../teacher/teacher.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // Registers/unregisters list of students specified by their emails to a teacher.
  async setRegistrationToTeacher(
    teacherEmail: string,
    studentEmails: string[],
    register = true,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const teacherExists = await queryRunner.manager
        .getRepository(Teacher)
        .exists({ where: { email: teacherEmail } });
      if (!teacherExists) throw new Error();
      const studentsCount = await queryRunner.manager
        .getRepository(Student)
        .count({ where: { email: In(studentEmails) } });
      if (studentsCount !== new Set(studentEmails).size) throw new Error();
      const qb = queryRunner.manager
        .createQueryBuilder()
        .relation(Student, 'teachers')
        .of(studentEmails);
      if (register) {
        await qb.add(teacherEmail);
      } else {
        await qb.remove(teacherEmail);
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        message: `Failed to ${register ? '' : 'un'}register students. Check that the emails provided are valid and present in the database and that the students have not already been registered to the teachers.`,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async setStudentSuspendStatus(student: string, suspend: boolean = true) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // since update does not check if the student exists, manually add one more query
      const validStudent = await queryRunner.manager
        .getRepository(Student)
        .exists({ where: { email: student } });
      if (!validStudent) {
        throw new Error();
      }
      await queryRunner.manager
        .getRepository(Student)
        .update(student, { suspended: suspend });
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        message:
          'Failed to suspend student. Check that the email provided is valid and present in the database.',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async getStudentsMentioned(notification: string): Promise<string[]> {
    const matches = [];
    const regex = emailRegexSafe();
    let match;
    // for all emails, get the @ mentions
    while ((match = regex.exec(notification)) !== null) {
      if (notification[regex.lastIndex - match[0].length - 1] === '@') {
        // email with @ sign
        matches.push(match[0]);
      }
    }

    let studentsFound: Student[];
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      studentsFound = await queryRunner.manager
        .getRepository(Student)
        .find({ where: { email: In(matches) } });
    } catch (e) {
      throw new BadRequestException({
        message:
          'Failed to retrieve students. Check that the database is correctly configured.',
      });
    } finally {
      await queryRunner.release();
    }
    // filter out suspended students
    return studentsFound
      .filter((student) => !student.suspended)
      .map((student) => student.email);
  }
}
