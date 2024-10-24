// media.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { auth, GoogleAuth } from 'google-auth-library';
import * as path from 'path';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { Readable } from 'node:stream';
import DatabaseService from 'src/database/database.service';
import { MediaType } from '@prisma/client';
import { getFileExtension } from 'src/util/customFunc';

@Injectable()
export class MediaService {
  private readonly gobalfolderId: string = '1ChViiTJ4MEvUXsY67Z0Id9AoljOeXntD';
  private auth: any;
  constructor(private _dbService: DatabaseService) {
    this.auth = new GoogleAuth({
      keyFile: path.join(__dirname, '../../../drive_service_account.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }

  async uploadFile(
    mediaFile: any,
    fileType: MediaType,
    userId: number,
  ): Promise<APIResponseDTO> {
    const drive = google.drive({ version: 'v3', auth: this.auth });
    const { originalname, fieldname, encoding, mimetype, buffer } = mediaFile;

    const metaData = {
      encoding,
      mimetype,
      originalname,
      fieldname,
    };
    const fileExtension = getFileExtension(mediaFile);

    const file = await drive.files.create({
      media: {
        mimeType: mimetype,
        body: Readable.from(buffer),
      },
      fields: 'id',
      requestBody: {
        name: originalname,
        parents: [this.gobalfolderId],
      },
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const shareableLink = `https://drive.google.com/uc?id=${file.data.id}`;

    const fileData = await this.getFileDataFromDrive(drive, file.data.id);

    const result = await this._dbService.$transaction(async (prisma) => {
      const media = await prisma.media.create({
        data: {
          name: originalname,
          // path: file?.request.responseURL,
          path: shareableLink,
          type: fileType,
          meta: metaData,
          extension: fileExtension,
          driveId: file.data.id,
          size: Number(fileData.size),
        },
      });

      return media;
    });

    return {
      status: true,
      message: 'Upload media successfull',
      data: result,
    };
  }

  async deleteFile(driveId: string, mediaId: number): Promise<APIResponseDTO> {
    const drive = google.drive({ version: 'v3', auth: this.auth });

    await this._dbService.$transaction(async (prisma) => {
      await drive.files.delete({
        fileId: driveId,
      });

      const media = await prisma.media.delete({
        where: {
          id: mediaId,
        },
      });

      return media;
    });

    return {
      status: true,
      message: 'Delete media successful',
      data: null,
    };
  }

  async findAllMedia(userId?: number): Promise<APIResponseDTO> {
    let findUser: any = null;
    if (userId) {
      findUser = await this._dbService.user.findUnique({
        where: { id: userId },
      });
    }

    const drive = google.drive({ version: 'v3', auth: this.auth });
    const driveMedia = await drive.files.list({ orderBy: 'modifiedTime' });

    let whereCondition = {};
    if (findUser) {
      whereCondition = { creatorId: userId };
    }

    const dbMedia = await this._dbService.media.findMany({
      where: { deletedAt: null, ...whereCondition },
      include: {
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const combinedMedia = driveMedia.data.files.map(
      (driveItem: any, i: number) => {
        const dbItem = dbMedia[i] || {}; // Get the corresponding dbMedia item or an empty object
        return {
          ...driveItem, // Spread properties from driveMedia
          ...dbItem, // Spread properties from dbMedia
        };
      },
    );

    return {
      status: true,
      message: 'media found',
      data: combinedMedia,
    };
  }

  async getSingleMedia(
    mediaId: number,
    driveId?: string,
  ): Promise<APIResponseDTO> {
    // const drive = google.drive({ version: 'v3', auth: this.auth });
    // const driveMedia = await this.getMediaFromDrive(drive, driveId, mediaId);
    const dbMedia = await this.getMediaFromDatabase(mediaId);

    if (!dbMedia) {
      throw new NotFoundException('Media not found');
    }

    // const mergedMedia = {
    //   ...(driveMedia || {}),
    //   ...(dbMedia || {}),
    // };

    return {
      status: true,
      message: 'single media found',
      data: dbMedia,
    };
  }

  async updateFile(fileId: string, filePath: string): Promise<any> {
    // const media = {
    //   mimeType: 'image/jpeg', // Change this as needed
    //   body: fs.createReadStream(filePath),
    // };
    // await this.driveService.files.update({
    //   fileId: fileId,
    //   media: media,
    // });
    // return { message: 'File updated successfully' };
  }

  private async getFileDataFromDrive(drive: drive_v3.Drive, fileId: string) {
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'size',
      includeLabels:
        'size,appProperties,hasThumbnail,mimeType,ownedByMe,description,createdTime,thumbnailLink,thumbnailVersion,videoMediaMetadata,trashedTime,fileExtension',
    });
    const fileData = file.data;
    return fileData;
  }

  private async formatBytes(bytes: number) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  // private async getMediaFromDrive(
  //   drive: drive_v3.Drive,
  //   driveId: string,
  //   mediaId: number,
  // ): Promise<any> {
  //   const media = await drive.files.get();
  //   return media || null;
  // }

  private async getMediaFromDatabase(mediaId: number): Promise<any> {
    const media = await this._dbService.media.findUnique({
      where: { id: mediaId },
      include: {
        creator: {
          select: {
            bio: true,
            fullName: true,
            email: true,
            id: true,
            username: true,
          },
        },
        _count: true,
      },
    });
    return media;
  }
}
