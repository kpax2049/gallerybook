import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto, SignupDto } from 'src/dto';
import { EditUserDto } from 'src/users/dto';
import { CreateGalleryDto } from 'src/gallery/dto';
import { Role, UserStatus } from '@prisma/client';

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
  afterAll(async () => {
    await app.close();
  });

  it.todo('should pass');

  describe('Auth', () => {
    const authDto: AuthDto = {
      email: 'kpaxde3@getMaxListeners.com',
      password: 'password123',
    };
    const signupDto: SignupDto = {
      ...authDto,
      fullName: 'E2E User',
      username: 'e2e-user',
    };
    describe('Signup', () => {
      it('Should Throw an Exception if Email is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: authDto.password })
          .expectStatus(400);
      });
      it('Should Throw an Exception if No Body Provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
      it('Should Signup', async () => {
        await pactum
          .spec()
          .post('/auth/signup')
          .withBody(signupDto)
          .expectStatus(201);

        await prisma.user.update({
          where: { email: authDto.email },
          data: { role: Role.ADMIN, status: UserStatus.active },
        });
      });
    });
    describe('Signin', () => {
      it('Should Throw an Exception if Email is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: authDto.password })
          .expectStatus(400);
      });
      it('Should Throw an Exception if Password is Empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: authDto.email })
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
          .withBody(authDto)
          .expectStatus(200)
          .stores('userAccessToken', 'accessToken');
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
          fullName: 'Humpty Dumpty',
          email: 'humptyDumpty@gmail.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.fullName)
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
          .expectJson('total', 0)
          .expectJsonLength('items', 0);
      });
    });
    describe('Create Gallery', () => {
      it('Should Create New Gallery', () => {
        const dto: CreateGalleryDto = {
          title: 'My first gallery',
          description: '123',
          content: JSON.stringify({ type: 'doc', content: [] }),
        };
        return pactum
          .spec()
          .post('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('galleryId', 'id')
          .stores('gallerySlug', 'slug');
      });
    });
    describe('Open Shared Gallery', () => {
      it('Should Hide a Draft Gallery From Anonymous Visitors', () => {
        return pactum
          .spec()
          .get('/public/galleries/slug/{slug}')
          .withPathParams('slug', '$S{gallerySlug}')
          .expectStatus(404);
      });
      it('Should Publish the Gallery', () => {
        return pactum
          .spec()
          .put('/galleries/{id}/content')
          .withPathParams('id', '$S{galleryId}')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody({ content: { type: 'doc', content: [] } })
          .expectStatus(200);
      });
      it('Should Open a Published Gallery Without Authentication', () => {
        return pactum
          .spec()
          .get('/public/galleries/slug/{slug}')
          .withPathParams('slug', '$S{gallerySlug}')
          .expectStatus(200)
          .expectJson('id', '$S{galleryId}');
      });
    });
    describe('Get Galleries', () => {
      it('Should Get Galleries ', () => {
        return pactum
          .spec()
          .get('/galleries')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .expectStatus(200)
          .expectJson('total', 1)
          .expectJsonLength('items', 1);
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
    describe('Create Gallery Comment', () => {
      it('Should Create a Comment Before Gallery Deletion', () => {
        return pactum
          .spec()
          .post('/comments')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody({
            text: 'This comment should be deleted with its gallery',
            galleryId: '$S{galleryId}',
          })
          .expectStatus(201)
          .stores('commentId', 'id');
      });
      it('Should Create a Nested Reply Before Gallery Deletion', () => {
        return pactum
          .spec()
          .post('/comments')
          .withHeaders({ Authorization: 'Bearer $S{userAccessToken}' })
          .withBody({
            text: 'This reply should also be deleted with its gallery',
            galleryId: '$S{galleryId}',
            parentId: '$S{commentId}',
          })
          .expectStatus(201);
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
          .expectJson('total', 0)
          .expectJsonLength('items', 0);
      });
    });
  });
});
