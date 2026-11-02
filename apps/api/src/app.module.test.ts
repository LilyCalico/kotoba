import { Controller, Get, Injectable, Module } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { GLOBAL_PREFIX, configureApp } from "./configure-app.js";

@Injectable()
class GreetingService {
  greet(): string {
    return "hej";
  }
}

@Controller("greeting")
class GreetingController {
  constructor(private readonly greeting: GreetingService) {}

  @Get()
  get(): { message: string } {
    return { message: this.greeting.greet() };
  }
}

@Module({ controllers: [GreetingController], providers: [GreetingService] })
class GreetingModule {}

describe("テスト環境の配線", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, GreetingModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("コンストラクタの型情報から依存が注入される", () => {
    expect(app.get(GreetingController).get()).toEqual({ message: "hej" });
  });

  it("HTTP 層が接頭辞込みで応答する", async () => {
    await request(app.getHttpServer())
      .get(`${GLOBAL_PREFIX}/greeting`)
      .expect(200, { message: "hej" });
  });
});
