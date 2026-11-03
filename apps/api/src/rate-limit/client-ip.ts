import { isIPv4, isIPv6 } from "node:net";

/** IPv4 を埋め込んだ IPv6（`::ffff:203.0.113.7`）。Node.js は IPv4 の接続元をこの形で渡すことがある。 */
const IPV4_MAPPED = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

/** IPv6 のアドレスを 8 つの 16 進のまとまりに広げる。`::` の省略と、末尾に埋め込んだ IPv4 を戻す。 */
function expandIPv6(address: string): string[] {
  let text = address.toLowerCase();
  const embedded = text.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (embedded) {
    const [a, b, c, d] = embedded.slice(1).map(Number) as [number, number, number, number];
    const tail = [(a << 8) | b, (c << 8) | d].map((group) => group.toString(16)).join(":");
    text = text.slice(0, embedded.index) + tail;
  }

  const [head = "", rest] = text.split("::");
  const left = head === "" ? [] : head.split(":");
  const right = rest === undefined || rest === "" ? [] : rest.split(":");
  const zeros = rest === undefined ? [] : Array<string>(8 - left.length - right.length).fill("0");
  return [...left, ...zeros, ...right].map((group) => group.replace(/^0+(?=.)/, ""));
}

/**
 * レートリミットで数える単位にする、クライアントの IP。
 * IPv6 は端末ごと・時間ごとにアドレスが変わるため、/64 のプレフィックス（前半 4 つのまとまり）にする。
 * IP として読めない値は、そのまま返す。
 */
export function rateLimitSubject(address: string): string {
  const mapped = address.match(IPV4_MAPPED)?.[1];
  if (mapped && isIPv4(mapped)) return mapped;
  if (isIPv4(address) || !isIPv6(address)) return address;
  return `${expandIPv6(address).slice(0, 4).join(":")}::/64`;
}

/**
 * リクエストを送ったクライアントの IP。Vercel がクライアントの IP を入れる `x-forwarded-for` の先頭を使い、
 * なければ接続元のアドレスを使う。リクエストが持ち込んだ `x-forwarded-for` は Vercel が上書きする。
 */
export function clientIpOf(request: {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string | undefined };
}): string {
  const header = request.headers["x-forwarded-for"];
  const forwarded = (Array.isArray(header) ? header[0] : header)?.split(",")[0]?.trim();
  return forwarded || request.socket.remoteAddress || "unknown";
}
