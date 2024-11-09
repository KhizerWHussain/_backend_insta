import { compare, genSalt, hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';

interface hashPasswordProps {
  plainText: string;
  saltValue?: number;
}

export async function HashPassword({
  plainText,
  saltValue = 10,
}: hashPasswordProps): Promise<any> {
  return new Promise(function (resolve: any, reject: any) {
    genSalt(saltValue, function (error: any, salt: any) {
      if (error) {
        reject(error);
      } else {
        hash(plainText, salt, function (error: any, hash: any) {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

interface comparePasswordProp {
  hash: any;
  plainText: string;
}

export async function ComparePassword({
  hash,
  plainText,
}: comparePasswordProp): Promise<any> {
  return new Promise(function (resolve: any, reject: any) {
    compare(plainText, hash, function (error: any, result: any) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

export function GenerateEnumDescriptionForSwagger(obj: Object): string {
  return Object.keys(obj)
    .map((key) => `${key} = ${obj[key]}`)
    .join(', ');
}

export function GenerateUUID(): string {
  return uuid();
}

export function ExcludeFields<T, Key extends keyof T>(
  model: T,
  keys: Key[],
): Omit<T, Key> {
  const newModel = { ...model };
  for (const k of keys) delete model[k];

  return model;
}
