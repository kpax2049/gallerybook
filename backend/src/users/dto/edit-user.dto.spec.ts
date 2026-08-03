import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuthDto, SignupDto } from 'src/dto';
import { EditUserDto } from './edit-user.dto';

describe('account DTO validation', () => {
  it.each([SignupDto, EditUserDto])(
    '%s normalizes account fields',
    async (Dto) => {
      const dto = plainToInstance(Dto, {
        email: '  USER@Example.COM ',
        fullName: '  Example User  ',
        username: '  example-user  ',
        ...(Dto === SignupDto ? { password: 'password123' } : {}),
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto).toMatchObject({
        email: 'user@example.com',
        fullName: 'Example User',
        username: 'example-user',
      });
    },
  );

  it.each([SignupDto, EditUserDto])(
    '%s rejects blank and oversized profile fields',
    async (Dto) => {
      const dto = plainToInstance(Dto, {
        email: 'user@example.com',
        fullName: ' '.repeat(3),
        username: 'x'.repeat(31),
        ...(Dto === SignupDto ? { password: 'password123' } : {}),
      });

      const errors = await validate(dto);

      expect(errors.map((error) => error.property)).toEqual(
        expect.arrayContaining(['fullName', 'username']),
      );
    },
  );

  it('allows profile updates to omit unchanged fields', async () => {
    const dto = plainToInstance(EditUserDto, { username: 'updated-user' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('normalizes email addresses used to sign in', async () => {
    const dto = plainToInstance(AuthDto, {
      email: '  USER@Example.COM ',
      password: 'password123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('user@example.com');
  });
});
