import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleLogger, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { StudentFactory } from './student-factory';
import { TeacherFactory } from './teacher-factory';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';

// End-to-end tests should not be run on the production database. 
// Host a separate test database and specify the connection details in .env.test.local
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let count = 0;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get(DataSource);
    await app.init();

    // generate test data
    StudentFactory.resetCount();
    TeacherFactory.resetCount();
    const students: Student[] = [];
    for (let i = 0; i < 5; i++) {
      students.push(StudentFactory.createStudent());
    }
    const teachers: Teacher[] = [];
    for (let i = 0; i < 3; i++) {
      teachers.push(TeacherFactory.createTeacher());
    }
    // register 3 students to teacher 2
    for (let i = 0; i < 3; i++) {
      // saving students first, so store the relation under teachers local entity
      teachers[1].students.push(students[i]);
    }
    // add test data
    let runner = dataSource.createQueryRunner();
    try {
      count += 1;
      console.log(`count: ${count}`);
      await runner.connect();
      await runner.startTransaction();
      await Promise.all(
        students.map(async (student) => await runner.manager.save(student))
      );
      await Promise.all(
        teachers.map(async (teacher) => await runner.manager.save(teacher))
      );
      await runner.commitTransaction();
      console.log("Seeded database");
    } catch (e) {
      await runner.rollbackTransaction();
      throw new Error(`Seeding database gave error: ${e}`);
    } finally {
      await runner.release();
    }
  });
  
  afterEach(async () => {
    let runner = dataSource.createQueryRunner();
    try {
      let entities = dataSource.entityMetadatas;
      let tableNames = entities.map((entity) => entity.tableName);
      await runner.connect();
      await runner.startTransaction();
      await runner.query('SET FOREIGN_KEY_CHECKS = 0;');
      await Promise.all(tableNames.map(
        async (tableName) => 
          await runner.query(`TRUNCATE ${tableName};`)
      ));
      await runner.query('SET FOREIGN_KEY_CHECKS = 1;');
      await runner.commitTransaction();
      console.log("Cleaned database");
    } catch (e) {
      await runner.rollbackTransaction();
      throw new Error(`Cleaning database gave the error: ${e}`);
    } finally {
      // Jest can't exit or something...
      // await dataSource.destroy();
      await runner.release();
      console.log("Closed connection");
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/api/register (POST)', () => {
    it('Successfully registers when students are not already registered', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({teacher: 't1@test.com', students: ['s1@test.com', 's2@test.com']})
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Fails registration when student emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({teacher: 't1@test.com', students: ['s0@test.com']})
        .set('Content-Type', 'application/json')
        .expect(400)
        .then(response => 
          expect(response.body).toHaveProperty('message')
        );
    });

    it('Fails registration when teacher emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({teacher: 't0@test.com', students: ['s1@test.com']})
        .set('Content-Type', 'application/json')
        .expect(400)
        .then(response => 
          expect(response.body).toHaveProperty('message')
        );
    });

    it('Fails registration when registration is duplicated', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({teacher: 't2@test.com', students: ['s1@test.com']})
        .set('Content-Type', 'application/json')
        .expect(400)
        .then(response => 
          expect(response.body).toHaveProperty('message')
        );
    });
  });
});
