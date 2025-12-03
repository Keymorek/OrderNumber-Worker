export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    let prefix, channel;

    // -------------------------
    // 1）GET 请求
    // -------------------------
    if (request.method === "GET") {
      prefix =
        url.searchParams.get("prefix") ||
        request.headers.get("X-Order-Prefix") ||
        "XH";

      channel =
        url.searchParams.get("channel") ||
        request.headers.get("X-Order-Channel") ||
        "HL";
    }

    // -------------------------
    // 2）POST 请求
    // -------------------------
    else if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        return new Response(
          JSON.stringify({ error: "POST body must be JSON" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await request.json();

      prefix =
        body.prefix ||
        request.headers.get("X-Order-Prefix") ||
        "XH";

      channel =
        body.channel ||
        request.headers.get("X-Order-Channel") ||
        "HL";
    }

    // -------------------------
    // 3）不支持的请求方法
    // -------------------------
    else {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const orderNo = generateOrderNo(prefix, channel);

    return new Response(JSON.stringify({ orderNo }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
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

/** 强制使用北京时间（UTC+8） */
function getBeijingTime() {
  const nowUtc = new Date();
  const timestampBJ = nowUtc.getTime() + 8 * 60 * 60 * 1000;
  return new Date(timestampBJ);
}

/** 生成 6 位随机数字 */
function random6Digits() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const num = arr[0] % 1000000;
  return String(num).padStart(6, "0");
}
