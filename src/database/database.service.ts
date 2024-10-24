import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
// import AppConfig from '../configs/app.config';
// import { Logger } from '../helpers/logger.helper';

// const QUERY: any = 'query';

@Injectable()
export default class DatabaseService
  extends PrismaClient
  implements OnModuleInit
{
  constructor() {
    super({
      errorFormat: 'pretty',
      log: ['warn', 'error', 'info', { emit: 'event', level: 'query' }],
    });
  }

  // private _injectQueryLogger() {
  //     if (AppConfig.APP.DEBUG) {
  //         this.$on(QUERY, (e: Prisma.QueryEvent) => {
  //             Logger.Trace(e.query);
  //             Logger.Trace(e.params);
  //             Logger.Trace(e.duration + ' ms');
  //         });
  //     }
  // }

  // private _applySoftDeleteMiddleware() {
  //     const softDeleteExtension = this.$extends({
  //         query: {
  //             $allModels: {
  //                 findFirst: async ({ args, query }) => {
  //                     if (!args.where) args.where = {};
  //                     args.where['deletedAt'] = null;
  //                     return query(args);
  //                 },
  //                 findMany: async ({ args, query }) => {
  //                     if (!args.where) args.where = {};
  //                     args.where['deletedAt'] = null;
  //                     return query(args);
  //                 },
  //                 update: async ({ args, query }) => {
  //                     args.where['deletedAt'] = null;
  //                     return query(args);
  //                 },
  //                 updateMany: async ({ args, query }) => {
  //                     if (!args.where) args.where = {};
  //                     args.where['deletedAt'] = null;
  //                     return query(args);
  //                 },
  //                 delete: async ({ args, query}: {args: any, query: any}) => {
  //                     args.data = { deletedAt: new Date() };
  //                     return query(args);
  //                 },
  //                 deleteMany: async ({ args, query}: {args: any, query: any}) => {
  //                     if (!args.data) args.data = {};
  //                     args.data.deletedAt = new Date();
  //                     return query(args);
  //                 },
  //                 count: async ({ args, query }) => {
  //                     if (!args.where) args.where = {};
  //                     args.where['deletedAt'] = null;
  //                     return query(args);
  //                 }
  //             }
  //         }
  //     });
  //     return softDeleteExtension;
  // }

  private _applySoftDeleteMiddleware() {
    /* Find Query Middleware */
    const findParams = ['find', 'findMany', 'findFirst', 'findUnique'];
    this.$use((params, next) => {
      if (findParams.includes(params.action)) {
        if (params.action === 'findUnique') {
          params.action = 'findFirst';
        }
        if (params.action === 'findMany') {
          if (!params.args) params.args = { where: {} };
          if (!params.args.where) params.args['where'] = {};
        }

        if (!params.args.where.deletedAt) {
          params.args.where['deletedAt'] = null;
        }
      }
      return next(params);
    });

    /* Update Query Middleware */
    this.$use((params, next) => {
      if (params.action === 'update') {
        params.action = 'updateMany';
        params.args.where['deletedAt'] = null;
      }

      if (params.action === 'updateMany') {
        if (!params.args.where) params.args.where = {};

        params.args.where['deletedAt'] = null;
      }
      return next(params);
    });

    /* Delete Query Middleware */
    this.$use((params, next) => {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';

        if (!params.args.data) params.args.data = {};

        params.args.data = { deletedAt: new Date() };
      }
      return next(params);
    });

    /* Count Query Middleware */
    this.$use((params, next) => {
      if (params.action == 'count') {
        if (!params.args) params.args = { where: {} };
        if (!params.args.where.deletedAt) {
          params.args.where['deletedAt'] = null;
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    // this._injectQueryLogger();
    this._applySoftDeleteMiddleware();
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
