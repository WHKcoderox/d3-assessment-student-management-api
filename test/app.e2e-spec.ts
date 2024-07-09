import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
  const students: Student[] = [];
  const teachers: Teacher[] = [];

  beforeAll((done) => {
    // Generate test data
    StudentFactory.resetCount();
    TeacherFactory.resetCount();
    for (let i = 0; i < 5; i++) {
      students.push(StudentFactory.createStudent());
    }
    for (let i = 0; i < 3; i++) {
      teachers.push(TeacherFactory.createTeacher());
    }

    // suspend student 5
    students[4].suspended = true;
    // register 3 students to teacher 2
    for (let i = 0; i < 3; i++) {
      // saving students first, so store the relation under teachers local entity
      teachers[1].students.push(students[i]);
    }
    // register 2 students to teacher 3
    for (let i = 0; i < 2; i++) {
      teachers[2].students.push(students[i]);
    }
    done();
  });

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get(DataSource);
    await app.init();

    // add test data
    const runner = dataSource.createQueryRunner();
    try {
      await runner.connect();
      await runner.startTransaction();
      await Promise.all(
        students.map((student) => runner.manager.save(student)),
      );
      await Promise.all(
        teachers.map((teacher) => runner.manager.save(teacher)),
      );
      await runner.commitTransaction();
    } catch (e) {
      await runner.rollbackTransaction();
      throw new Error(`Seeding database gave error: ${e}`);
    } finally {
      await runner.release();
    }
  });

  // clear database
  afterEach(async () => {
    const runner = dataSource.createQueryRunner();
    try {
      const entities = dataSource.entityMetadatas;
      const tableNames = entities.map((entity) => entity.tableName);
      await runner.connect();
      await runner.startTransaction();
      await runner.query('SET FOREIGN_KEY_CHECKS = 0;');
      await Promise.all(
        tableNames.map(
          async (tableName) => await runner.query(`TRUNCATE ${tableName};`),
        ),
      );
      await runner.query('SET FOREIGN_KEY_CHECKS = 1;');
      await runner.commitTransaction();
    } catch (e) {
      await runner.rollbackTransaction();
      throw new Error(`Cleaning database gave the error: ${e}`);
    } finally {
      await runner.release();
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
        .send({
          teacher: teachers[0].email,
          students: [students[0].email, students[1].email],
        })
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Fails registration when student emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({ teacher: teachers[0].email, students: ['s0@test.com'] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => expect(response.body).toHaveProperty('message'));
    });

    it('Fails registration when teacher emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({ teacher: 't0@test.com', students: [students[0].email] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => expect(response.body).toHaveProperty('message'));
    });

    it('Fails registration when registration is duplicated', () => {
      return request(app.getHttpServer())
        .post('/api/register')
        .send({ teacher: teachers[1].email, students: [students[0].email] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => expect(response.body).toHaveProperty('message'));
    });
  });

  describe('/api/unregister (POST)', () => {
    it('Successfully unregisters when students are already registered', () => {
      return request(app.getHttpServer())
        .post('/api/unregister')
        .send({
          teacher: teachers[1].email,
          students: [students[0].email, students[1].email],
        })
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Ignores unregistration duplication', () => {
      return request(app.getHttpServer())
        .post('/api/unregister')
        .send({ teacher: teachers[0].email, students: [students[0].email] })
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Fails unregistration when student emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/unregister')
        .send({ teacher: teachers[0].email, students: ['s0@test.com'] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => expect(response.body).toHaveProperty('message'));
    });

    it('Fails unregistration when teacher emails are not found', () => {
      return request(app.getHttpServer())
        .post('/api/unregister')
        .send({ teacher: 't0@test.com', students: [students[0].email] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => expect(response.body).toHaveProperty('message'));
    });
  });

  describe('/api/commonstudents (GET)', () => {
    it('Gives all students registered under one teacher', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents?teacher=t2%40test.com')
        .send()
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('students');
          expect(response.body['students']).toHaveLength(3);
          expect(response.body['students']).toContain(students[0].email);
          expect(response.body['students']).toContain(students[1].email);
          expect(response.body['students']).toContain(students[2].email);
        });
    });

    it('Gives all students registered under two teachers', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents?teacher=t2%40test.com&teacher=t3%40test.com')
        .send()
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('students');
          expect(response.body['students']).toHaveLength(2);
          expect(response.body['students']).toContain(students[0].email);
          expect(response.body['students']).toContain(students[1].email);
        });
    });

    it('Gives no students when queried teachers do not share students', () => {
      return request(app.getHttpServer())
        .get(
          '/api/commonstudents?teacher=t1%40test.com&teacher=t2%40test.com&teacher=t3%40test.com',
        )
        .send()
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('students');
          expect(response.body['students']).toHaveLength(0);
        });
    });

    it('Fails when queried teacher does not exist', () => {
      return request(app.getHttpServer())
        .get('/api/commonstudents?teacher=t0%40test.com')
        .send()
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/suspend (POST)', () => {
    it('Successfully suspends student', () => {
      return request(app.getHttpServer())
        .post('/api/suspend')
        .send({ student: [students[1].email] })
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Fails to suspend nonexistent student', () => {
      return request(app.getHttpServer())
        .post('/api/suspend')
        .send({ student: ['s0@test.com'] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/unsuspend (POST)', () => {
    it('Successfully unsuspends student', () => {
      return request(app.getHttpServer())
        .post('/api/unsuspend')
        .send({ student: [students[4].email] })
        .set('Content-Type', 'application/json')
        .expect(204);
    });

    it('Fails to unsuspend nonexistent student', () => {
      return request(app.getHttpServer())
        .post('/api/unsuspend')
        .send({ student: ['s0@test.com'] })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/retrievefornotifications (POST)', () => {
    it('Retrieves list of registered students', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({ teacher: teachers[1].email, notification: '' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('recipients');
          expect(response.body['recipients']).toHaveLength(3);
          expect(response.body['recipients']).toContain(students[0].email);
          expect(response.body['recipients']).toContain(students[1].email);
          expect(response.body['recipients']).toContain(students[2].email);
        });
    });

    it('Retrieves list of mentioned students', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: teachers[0].email,
          notification: 'blabla @s1@test.com,@s2@test.com',
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('recipients');
          expect(response.body['recipients']).toHaveLength(2);
          expect(response.body['recipients']).toContain(students[0].email);
          expect(response.body['recipients']).toContain(students[1].email);
        });
    });

    it('Retrieves distinct list of registered and mentioned students', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: teachers[1].email,
          notification: 'blabla @s4@test.com,@s2@test.com',
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('recipients');
          expect(response.body['recipients']).toHaveLength(4);
          expect(response.body['recipients']).toContain(students[0].email);
          expect(response.body['recipients']).toContain(students[1].email);
          expect(response.body['recipients']).toContain(students[2].email);
          expect(response.body['recipients']).toContain(students[3].email);
        });
    });

    it('Ignores suspended students', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: teachers[0].email,
          notification: 'blabla @s5@test.com',
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('recipients');
          expect(response.body['recipients']).toHaveLength(0);
        });
    });

    it('Fails when invalid teacher is provided', () => {
      return request(app.getHttpServer())
        .post('/api/retrievefornotifications')
        .send({
          teacher: 't0@test.com',
          notification: 'blabla @s4@test.com,@s2@test.com',
        })
        .set('Content-Type', 'application/json')
        .expect(400)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
        });
    });
  });

  describe('Side-effect tests', () => {
    it('Registering students allows them to retrieve notifications', async () => {
      await request(app.getHttpServer())
      .post('/api/retrievefornotifications')
      .send({
        teacher: teachers[0].email,
        notification: '',
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('recipients');
        expect(response.body['recipients']).toHaveLength(0);
      });

      await request(app.getHttpServer())
      .post('/api/register')
      .send({
        teacher: teachers[0].email,
        students: [students[0].email, students[1].email],
      })
      .set('Content-Type', 'application/json')
      .expect(204);

      return request(app.getHttpServer())
      .post('/api/retrievefornotifications')
      .send({
        teacher: teachers[0].email,
        notification: '',
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('recipients');
        expect(response.body['recipients']).toHaveLength(2);
        expect(response.body['recipients']).toContain(students[0].email);
        expect(response.body['recipients']).toContain(students[1].email);
      });
    });

    it('Suspending students makes them unable to retrieve notifications', async () => {
      await request(app.getHttpServer())
      .post('/api/retrievefornotifications')
      .send({
        teacher: teachers[2].email,
        notification: '',
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('recipients');
        expect(response.body['recipients']).toHaveLength(2);
        expect(response.body['recipients']).toContain(students[0].email);
        expect(response.body['recipients']).toContain(students[1].email);
      });

      await request(app.getHttpServer())
      .post('/api/suspend')
      .send({
        student: students[0].email,
      })
      .set('Content-Type', 'application/json')
      .expect(204);

      return request(app.getHttpServer())
      .post('/api/retrievefornotifications')
      .send({
        teacher: teachers[2].email,
        notification: '',
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty('recipients');
        expect(response.body['recipients']).toHaveLength(1);
        expect(response.body['recipients']).toContain(students[1].email);
      });
    });
  });
});
