<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Description

API service defined based on requirements listed in https://gist.github.com/d3hiring/4d1415d445033d316c36a56f0953f4ef.

Expected errors:
- `/api/register`: Invalid/unknown emails for teacher/students, duplicate registration
- `/api/suspend`: Invalid/unknown student emails
- `/api/commonstudents`: Missing/invalid/unknown teacher emails
- `/api/retrievefornotifications`: Invalid/unknown teacher email

Additional endpoints:
- `/api/unsuspend`: Unsuspend with the same behaviour
- `/api/unregister`: Unregister. Unlike register, unregister ignores unregistering already unregistered students.

## Installation

```bash
$ npm install
```

## Running the app

Before testing the app, make sure .env.test.local and .env.development.local files are set up following the .env.example format. Make sure to provide a test database to run the tests mentioned later, else significant unwanted changes might happen.
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

Due to the nature of the API endpoints, only end-to-end testing was done both for individual features and for testing endpoints with side-effects.

```bash
# e2e tests
$ npm run test:e2e
```
