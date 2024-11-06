import { Controller, Body, Param } from '@nestjs/common';
import { PostService } from './post.service';
import {
  commentOnPostDto,
  CreatePostDto,
  createSavedPostFolderDto,
  likeCommentOfPostDto,
  PollAnswerDTO,
  savedPostDTO,
  UpdatePostDto,
  UpdatePostFeedTypeDto,
} from './dto/post.dto';
import {
  ApiController,
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

@ApiController({
  path: '/post',
  tag: 'post',
  version: '1',
})
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

  @Authorized()
  @Post({
    path: '/folder/savedPosts/create',
    description: 'creating saved posts folder',
    response: APIResponseDTO,
  })
  createSavedPostsFolder(
    @CurrentUser() user: User,
    @Body() payload: createSavedPostFolderDto,
  ) {
    return this._postService.createSavedPostFolder(user, payload);
  }

  @Authorized()
  @Post({
    path: '/like/:postId',
    description: 'like & unlike post (toggle)',
    response: APIResponseDTO,
  })
  likePost(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this._postService.likeUnlikePost(user, Number(postId));
  }

  @Authorized()
  @Get({
    path: '/likes/:postId',
    description: 'get likes of single post',
    response: APIResponseDTO,
  })
  getLikesOfPost(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this._postService.getLikesOfPost(user, Number(postId));
  }

  @Authorized()
  @Get({
    path: '/getTaggedOn',
    description: 'get post which user tagged on',
    response: APIResponseDTO,
  })
  getTaggedPosts(@CurrentUser() user: User) {
    return this._postService.getTaggedPosts(user);
  }

  @Authorized()
  @Get({
    path: '/getUsersTaggedOnPost/:postId',
    description: 'get users who are tagged on single post (anyone post)',
    response: APIResponseDTO,
  })
  getTaggedUserOfSinglePost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
  ) {
    return this._postService.getTaggedUserOfSinglePost(user, postId);
  }

  @Authorized()
  @Get({
    path: '/detail/:postId',
    description: 'get post detail by Id',
    response: APIResponseDTO,
  })
  getPostDetails(@CurrentUser() user: User, @Param('postId') postId: number) {
    return this._postService.getPostDetails(user, postId);
  }

  @Authorized()
  @Post({
    path: '/comment/:postId',
    description: 'comment on post or comment',
    response: APIResponseDTO,
  })
  commentOnPost(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
    @Body() payload: commentOnPostDto,
  ) {
    return this._postService.commentOnPost(user, Number(postId), payload);
  }

  @Authorized()
  @Delete({
    path: '/:postId/comment/:commentId',
    description: 'delete comment on post',
    response: APIResponseDTO,
  })
  deleteCommentOnPost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
  ) {
    return this._postService.deleteCommentOnPost(
      user,
      Number(postId),
      Number(commentId),
    );
  }

  @Authorized()
  @Get({
    path: '/:postId/comments',
    description: 'get parent comment of post',
    response: APIResponseDTO,
  })
  getParentCommentsOfPost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
  ) {
    return this._postService.getParentCommentsOfPost(user, Number(postId));
  }

  @Authorized()
  @Get({
    path: '/:postId/comment/:commentId',
    description: 'get nested comment of post based on parentComment',
    response: APIResponseDTO,
  })
  getNestedCommentOfPost(
    @CurrentUser() user: User,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
  ) {
    return this._postService.getNestedComments(user, postId, commentId);
  }

  @Authorized()
  @Post({
    path: '/like-unlike/comment',
    description: 'like-unlike comment (toggle)',
    response: APIResponseDTO,
  })
  likeUnlikePostComment(
    @CurrentUser() user: User,
    @Body() payload: likeCommentOfPostDto,
  ) {
    return this._postService.likeUnlikeComment(user, payload);
  }

  @Authorized()
  @Post({
    path: '/poll/answer',
    description: 'answer post poll',
    response: APIResponseDTO,
  })
  answerPoll(@CurrentUser() user: User, @Body() payload: PollAnswerDTO) {
    return this._postService.answerPoll(user, payload);
  }

  // @Authorized()
  // @Get({
  //   path: '/comment/likes/:parentCommentId',
  //   description: 'Get Likes of comment of a Post',
  //   response: APIResponseDTO,
  // })
  // CommentLikesOfPost(
  //   @CurrentUser() user: User,
  //   @Param('parentCommentId') commentId: string,
  // ): Promise<APIResponseDTO> {
  //   return this._postService.getLikesOfComment(Number(commentId));
  // }
}
