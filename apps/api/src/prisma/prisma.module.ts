import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

/** PrismaService をどのモジュールからも imports なしで注入できるようにする。 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
