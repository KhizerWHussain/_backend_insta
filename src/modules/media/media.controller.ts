import { MediaService } from './media.service';
import { ApiController, Delete, Get, Post } from 'src/core/decorators';
import {
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
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

  @Delete({
    path: '/delete/:driveId/:mediaId',
    description: 'deleting media on google drive',
    response: APIResponseDTO,
  })
  async deleteFile(
    @Param('driveId') driveId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this._mediaService.deleteFile(driveId, Number(mediaId));
  }

  @Get({
    path: '/getAll',
    description: 'get all media from google drive & postgresql',
    response: APIResponseDTO,
  })
  async getAllMedia(@Query('userId') userId?: string) {
    return this._mediaService.findAllMedia(Number(userId));
  }

  @Get({
    path: '/singleMedia',
    description: 'get all media from google drive & postgresql',
    response: APIResponseDTO,
  })
  async getSingleMedia(
    @Query('mediaId') mediaId: string,
    @Query('driveId') driveId?: string,
  ) {
    return this._mediaService.getSingleMedia(Number(mediaId), driveId);
  }

  @Put(':fileId/update')
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(@Param('fileId') fileId: string, @UploadedFile() file: any) {
    return this._mediaService.updateFile(fileId, file.path);
  }
}
