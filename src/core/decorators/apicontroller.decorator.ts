import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

type ApiControllerArgs = {
  path?: string;
  version?: '1' | '2' | ['1', '2'];
  tag?: string;
};

export function ApiController(args: ApiControllerArgs) {
  return applyDecorators(ApiTags(args.tag || 'default'), Controller(args));
}
