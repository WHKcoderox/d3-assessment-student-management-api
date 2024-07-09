import { BadRequestException, Injectable } from '@nestjs/common';
import { Teacher } from './teacher.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Student } from '../student/student.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  // Obtains a list of student emails registered to queried teachers.
  async studentsRegisteredToTeachers(teacherEmails: string[]): Promise<string[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    let acc: string[][] = teacherEmails.map(() => []);
    try {
      // assumption: not an excessive number of teachers (>10) is typically queried
      await Promise.all(teacherEmails.map(async (teacher, idx) => {
        let teacherExists = await queryRunner.manager
      .getRepository(Teacher).exists({where: {email: teacher}});
        if (!teacherExists) throw new Error();
        acc[idx] = await queryRunner.manager
          .createQueryBuilder()
          .relation(Teacher, "students")
          .of(teacher)
          .loadMany()
          .then(
            students => students.map(student => student.email)
          )
      }));
      for (let i = 1; i < acc.length; i++) {
        acc[0] = acc[0].filter(email => acc[i].includes(email));
      }
      return acc[0];
    } catch (e) {
      throw new BadRequestException({
        'message': 'Failed to query students registered under teachers. Check that the email(s) were spelled correctly and the database is configured correctly.'
      });
    } finally {
      await queryRunner.release();
    }
  }
}
