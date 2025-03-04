import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/dto';
import { EditUserDto } from 'src/users/dto';
import { CreateGalleryDto } from 'src/gallery/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
    // inject prisma service dependency and clean up the DB
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });
  afterAll(() => {
    app.close();
  });

  it.todo('should pass');

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'kpaxde3@getMaxListeners.com',
      password: '123',
    };
    describe('Signup', () => {
      it('Should Throw an Exception if Email is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('Should Throw an Exception if Password is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('Should Throw an Exception if No Body Provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
      it('Should Signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('Should Throw an Exception if Email is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('Should Throw an Exception if Password is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('Should Throw an Exception if No Body Provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      });
      it('Should Signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAccessToken', 'access_token');
      });
    });
  });
  describe('User', () => {
    describe('Get Me', () => {
      it('Should Get Current User', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200);
      });
    });
    describe('Edit User', () => {
      it('Should Edit User', () => {
        const dto: EditUserDto = {
          firstName: 'Humpty',
          email: 'humptyDumpty@gmail.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });
  describe('Gallery', () => {
    describe('Get Empty Galleries', () => {
      it('Should Get Empty Galleries ', () => {
        return pactum
          .spec()
          .get('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create Gallery', () => {
      it('Should Create New Gallery', () => {
        const dto: CreateGalleryDto = {
          title: 'My first gallery',
          description: '123',
        };
        return pactum
          .spec()
          .post('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('galleryId', 'id');
      });
    });
    describe('Get Galleries', () => {
      it('Should Get Galleries ', () => {
        return pactum
          .spec()
          .get('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });
    describe('Get Gallery By Id', () => {
      it('Should Get Gallery by Id ', () => {
        return pactum
          .spec()
          .get('/galleries/{id}')
          .withPathParams('id', '$S{galleryId}')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200)
          .expectBodyContains('$S{galleryId}');
      });
    });
    describe('Edit Gallery By Id', () => {
      it('Should Edit Gallery by Id ', () => {
        const dto: CreateGalleryDto = {
          title: 'My first edited gallery',
          description: 'Humpty',
        };
        return pactum
          .spec()
          .patch('/galleries/{id}')
          .withPathParams('id', '$S{galleryId}')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });
    describe('Delete Gallery By Id', () => {
      it('Should Delete Gallery by Id ', () => {
        return pactum
          .spec()
          .delete('/galleries/{id}')
          .withPathParams('id', '$S{galleryId}')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(204);
      });
      it('Should Get Empty Galleries ', () => {
        return pactum
          .spec()
          .get('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
