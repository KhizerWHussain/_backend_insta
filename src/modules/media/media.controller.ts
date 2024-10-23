import { MediaService } from './media.service';
import { ApiController, Post } from 'src/core/decorators';
import {
  Delete,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { MediaType } from '@prisma/client';

@ApiController({
  path: '/media',
  tag: 'media',
  version: '1',
})
export class MediaController {
  constructor(private readonly _mediaService: MediaService) {}

  @Post({
    path: '/upload',
    response: APIResponseDTO,
    description: 'media upload to google drive',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('fileType') fileType: MediaType,
    @Body('userId') userId?: string,
  ) {
    return this._mediaService.uploadFile(file, fileType, Number(userId));
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    return this._mediaService.deleteFile(fileId);
  }

  @Put(':fileId/update')
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(@Param('fileId') fileId: string, @UploadedFile() file: any) {
    return this._mediaService.updateFile(fileId, file.path);
  }
}
