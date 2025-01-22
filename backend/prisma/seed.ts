import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }),
        firstName: firstName,
        lastName: lastName,
        hash: '$argon2id$v=19$m=65536,t=3,p=4$KjtVrfEeE2LUan8FcKgxsg$5JsHfwkLO5cazqfN0G5daQIUyh8I3bYn3QhEE0hYavM',
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
