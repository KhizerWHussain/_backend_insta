// media.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { auth, GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { Readable } from 'node:stream';
import DatabaseService from 'src/database/database.service';
import { MediaType } from '@prisma/client';

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
    const { originalname, fieldname, encoding, mimetype, buffer } = mediaFile;
    const drive = google.drive({ version: 'v3', auth: this.auth });

    const fileExtension = path.extname(originalname).replace('.', ''); // Remove the leading dot

    console.log('mediaFile =>', mediaFile);

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

    const metaData = {
      encoding,
      mimetype,
      originalname,
    };

    const media = await this._dbService.media.create({
      data: {
        name: originalname,
        path: file?.request.responseURL,
        // id: Number(file.data.id),
        type: fileType,
        meta: metaData,
        extension: fileExtension,
        creator: { connect: { id: userId } },
        // driveId: Number(file.data.id),
      },
    });

    return {
      status: true,
      message: 'Upload media successfull',
      data: media,
    };
  }

  async deleteFile(fileId: string): Promise<any> {
    // await this.driveService.files.delete({
    //   fileId: fileId,
    // });
    // return { message: 'File deleted successfully' };
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
}
