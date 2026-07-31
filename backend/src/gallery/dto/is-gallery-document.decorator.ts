import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ProseMirrorDocSchema } from '../zod/prosemirror.schema';

export function IsGalleryDocument(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isGalleryDocument',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return ProseMirrorDocSchema.safeParse(value).success;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ProseMirror document`;
        },
      },
    });
  };
}
