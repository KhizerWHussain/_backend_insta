import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFollowDto } from './dto/follow.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { RequestStatus, User } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
  ) {}

  async sendFollowRequest(
    user: User,
    recieverId: number,
  ): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({
      userId: recieverId,
      errorMessage: 'requested user donot exist',
    });

    if (user.id === recieverId) {
      throw new BadRequestException(
        'You cannot send a follow request to yourself',
      );
    }

    const existingRequest = await this._db.followRequest.findFirst({
      where: {
        requesterId: user.id,
        receiverId: recieverId,
        deletedAt: null,
        status: 'PENDING',
      },
    });
    if (existingRequest) {
      await this._db.followRequest.deleteMany({
        where: {
          requesterId: user.id,
          receiverId: recieverId,
          deletedAt: null,
          status: 'PENDING',
        },
      });
      return {
        status: true,
        message: 'follow request has been unsent',
        data: null,
      };
    }

    await this._db.followRequest.create({
      data: {
        requesterId: user.id,
        receiverId: recieverId,
      },
    });

    return {
      status: true,
      message: 'follow request has been sent',
      data: null,
    };
  }

  async acceptFollowRequest(
    user: User,
    requestId: number,
  ): Promise<APIResponseDTO> {
    const request = await this._db.followRequest.findUnique({
      where: { id: requestId, receiverId: user.id, deletedAt: null },
    });

    if (!request) {
      throw new BadRequestException('request donot exist');
    }

    this._util.checkUserExistOrNot({ userId: user.id });

    const result = await this._db.$transaction(async (prisma) => {
      await prisma.followRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: RequestStatus.ACCEPTED,
        },
      });
      await prisma.followRequest.delete({
        where: {
          id: requestId,
        },
      });
      const createFollower = await prisma.userFollow.create({
        data: {
          follower: { connect: { id: request.requesterId } },
          following: { connect: { id: user.id } },
        },
      });
      return createFollower;
    });

    return {
      status: true,
      message: 'Follow request accepted',
      data: result,
    };
  }

  async declineFollowRequest(
    user: User,
    requestId: number,
  ): Promise<APIResponseDTO> {
    const request = await this._db.followRequest.findUnique({
      where: { id: requestId, receiverId: user.id, deletedAt: null },
    });

    if (!request) {
      throw new BadRequestException('Follow request does not exist');
    }

    await this._db.$transaction(async (prisma) => {
      await prisma.followRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: RequestStatus.DECLINED,
        },
      });
      await prisma.followRequest.delete({
        where: {
          id: requestId,
        },
      });
    });

    return {
      status: true,
      message: 'Follow request declined',
      data: null,
    };
  }

  async unfollowUser(
    user: User,
    unfollowUserId: number,
  ): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: unfollowUserId });

    if (user.id === unfollowUserId) {
      throw new BadRequestException('you cannot unfollow yourself');
    }

    // Find the follow relationship between the users
    const followRelation = await this._db.userFollow.findFirst({
      where: {
        followerId: user.id, // The user who wants to unfollow
        followingId: unfollowUserId, // The user to be unfollowed
      },
    });

    if (!followRelation) {
      throw new BadRequestException('You are not following this user');
    }

    await this._db.$transaction(async (prisma) => {
      await prisma.userFollow.deleteMany({
        where: { id: followRelation.id },
      });
    });

    return {
      status: true,
      message: 'Unfollowed successfully',
      data: null,
    };
  }
}
