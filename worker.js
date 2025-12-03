//V1.0
export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const headers = request.headers;

    // 1）前缀：优先级 = query.prefix > Header:X-Order-Prefix > 默认 "XH"
    const prefix =
      url.searchParams.get("prefix") ||
      headers.get("X-Order-Prefix") ||
      "XH";

    // 2）渠道编码：优先级 = query.channel > Header:X-Order-Channel > 默认 "HL"
    const channel =
      url.searchParams.get("channel") ||
      headers.get("X-Order-Channel") ||
      "HL";

    const orderNo = generateOrderNo(prefix, channel);

    return new Response(JSON.stringify({ orderNo }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  },
};

/**
 * 生成订单号： prefix + YYMMDDHHMM(北京时间) + channel + 6位随机数
 */
function generateOrderNo(prefix, channel) {
  const nowBJ = getBeijingTime();
  const yy = String(nowBJ.getFullYear()).slice(-2);
  const MM = String(nowBJ.getMonth() + 1).padStart(2, "0");
  const dd = String(nowBJ.getDate()).padStart(2, "0");
  const hh = String(nowBJ.getHours()).padStart(2, "0");
  const mm = String(nowBJ.getMinutes()).padStart(2, "0");

  const timePart = yy + MM + dd + hh + mm;
  const randomPart = random6Digits();

  return `${prefix}${timePart}${channel}${randomPart}`;
}

/**
 * 强制使用北京时间（UTC+8）
 * Workers 运行环境内部时间是 UTC，这里手动加 8 小时。
 */
function getBeijingTime() {
  const nowUtc = new Date();
  const timestampBJ = nowUtc.getTime() + 8 * 60 * 60 * 1000;
  return new Date(timestampBJ);
}

/**
 * 生成 6 位随机数字（000000 - 999999）
 */
function random6Digits() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const num = arr[0] % 1000000;
  return String(num).padStart(6, "0");
}
