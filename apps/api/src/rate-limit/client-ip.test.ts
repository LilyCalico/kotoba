import { describe, expect, it } from "vitest";
import { clientIpOf, rateLimitSubject } from "./client-ip.js";

function requestWith(forwarded: string | string[] | undefined, remoteAddress?: string) {
  return { headers: { "x-forwarded-for": forwarded }, socket: { remoteAddress } };
}

describe("clientIpOf", () => {
  it("x-forwarded-for の先頭を使う", () => {
    expect(clientIpOf(requestWith("203.0.113.7", "10.0.0.1"))).toBe("203.0.113.7");
    expect(clientIpOf(requestWith(" 203.0.113.7 , 10.0.0.2", "10.0.0.1"))).toBe("203.0.113.7");
    expect(clientIpOf(requestWith(["203.0.113.7", "10.0.0.2"], "10.0.0.1"))).toBe("203.0.113.7");
  });

  it("x-forwarded-for がなければ接続元のアドレスを使う", () => {
    expect(clientIpOf(requestWith(undefined, "::ffff:127.0.0.1"))).toBe("::ffff:127.0.0.1");
    expect(clientIpOf(requestWith("", "10.0.0.1"))).toBe("10.0.0.1");
  });
});

describe("rateLimitSubject", () => {
  it("IPv4 はそのまま数える", () => {
    expect(rateLimitSubject("203.0.113.7")).toBe("203.0.113.7");
  });

  it("IPv4 を埋め込んだ IPv6 は IPv4 として数える", () => {
    expect(rateLimitSubject("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(rateLimitSubject("::FFFF:127.0.0.1")).toBe("127.0.0.1");
  });

  it("IPv6 は /64 のプレフィックスで数え、同じ /64 の別のアドレスを同じ単位にする", () => {
    const subject = rateLimitSubject("2001:db8:85a3:12::8a2e:370:7334");

    expect(subject).toBe("2001:db8:85a3:12::/64");
    expect(rateLimitSubject("2001:0db8:85a3:0012:aaaa:bbbb:cccc:dddd")).toBe(subject);
    expect(rateLimitSubject("2001:db8:85a3:13::1")).not.toBe(subject);
  });

  it("省略の位置が違う IPv6 も、同じ /64 なら同じ単位にする", () => {
    expect(rateLimitSubject("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(rateLimitSubject("2001:db8:0:0:1::")).toBe("2001:db8:0:0::/64");
    expect(rateLimitSubject("::1")).toBe("0:0:0:0::/64");
  });

  it("IP として読めない値は、そのまま数える", () => {
    expect(rateLimitSubject("unknown")).toBe("unknown");
  });
});
