import { Controller, Body, Param } from '@nestjs/common';
import { PostService } from './post.service';
import {
  CreatePostDto,
  savedPostDTO,
  UpdatePostDto,
  UpdatePostFeedTypeDto,
} from './dto/post.dto';
import {
  Authorized,
  CurrentUser,
  Delete,
  Get,
  Patch,
  Post,
  Put,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';

@Controller('post')
export class PostController {
  constructor(private readonly _postService: PostService) {}

  @Authorized()
  @Post({
    path: '/create',
    response: APIResponseDTO,
    description: 'creating post',
  })
  create(
    @CurrentUser() user: User,
    @Body() payload: CreatePostDto,
  ): Promise<APIResponseDTO> {
    return this._postService.create(user, payload);
  }

  @Authorized()
  @Delete({
    path: '/delete/:postId',
    response: APIResponseDTO,
    description: 'deleting single post of user using postId',
  })
  deleteMyPost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
  ): Promise<APIResponseDTO> {
    return this._postService.deletePost(user, postId);
  }

  @Authorized()
  @Get({
    path: '/feed/getAll',
    description: 'get my all posts on feed (not archived)',
    response: APIResponseDTO,
  })
  getMyPosts(@CurrentUser() user: User): Promise<APIResponseDTO> {
    return this._postService.findAll(user);
  }

  @Authorized()
  @Patch({
    path: '/update/:postId',
    description: 'get my all posts on feed (not archived)',
    response: APIResponseDTO,
  })
  updateMyPost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
    @Body() payload: UpdatePostDto,
  ): Promise<APIResponseDTO> {
    return this._postService.updatePost(user, postId, payload);
  }

  @Authorized()
  @Put({
    path: '/update/feedType',
    description: 'toggle update post feed type',
    response: APIResponseDTO,
  })
  updatePostFeedType(
    @CurrentUser() user: User,
    @Body() payload: UpdatePostFeedTypeDto,
  ) {
    return this._postService.updatePostFeedType(user, payload);
  }

  @Authorized()
  @Get({
    path: '/getArchived',
    description: 'get my archived posts',
    response: APIResponseDTO,
  })
  getAllMyArchivedPosts(@CurrentUser() user: User) {
    return this._postService.getAllMyArchivedPosts(user);
  }

  @Authorized()
  @Post({
    path: '/savePost',
    description: 'save anyone post including own post',
    response: APIResponseDTO,
  })
  savedPost(@CurrentUser() user: User, @Body() payload: savedPostDTO) {
    return this._postService.savedPost(user, payload);
  }

  @Authorized()
  @Get({
    path: '/getAllSavedPosts/:folderId',
    description: 'get all saved posts using folderId',
    response: APIResponseDTO,
  })
  getAllSavedPostsOfFolder(
    @CurrentUser() user: User,
    @Param('folderId') folderId: number,
  ) {
    return this._postService.getAllMySavedPosts(user, folderId);
  }

  @Authorized()
  @Get({
    path: '/getSavedPostsFolders',
    description: 'get all saved posts folders of single user',
    response: APIResponseDTO,
  })
  getAllSavedPostsFolders(@CurrentUser() user: User) {
    return this._postService.getAllSavedPostsFolders(user);
  }

  // @Get()
  // findAll() {
  //   return this._postService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this._postService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
  //   return this.postService.update(+id, updatePostDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this._postService.remove(+id);
  // }
}
