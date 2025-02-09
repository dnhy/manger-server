const Koa = require("koa");
const app = new Koa();
const router = require("koa-router")();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const users = require("./routes/users");
const log4js = require("./utils/log4j");
const koaJwt = require("koa-jwt");
const cors = require("koa2-cors");
const Util = require("./utils/util");
const { SECRET, whiteList } = require("./config/options");

// error handler
onerror(app);

require("./config/db");

app.use(
  cors({
    origin: function (ctx) {
      let url = ctx.header?.referer?.substr(0, ctx.header.referer.length - 1);
      const domin = url?.split("/")[2]?.split(":")[0];

      if (whiteList.includes(domin)) {
        return url; //注意，这里域名末尾不能带/，否则不成功，所以在之前我把/通过substr干掉了
      }
      return "http://localhost:3000"; //默认允许本地请求3000端口可跨域
    },
    maxAge: 5, //指定本次预检请求的有效期，单位为秒。
    credentials: true, //是否允许发送Cookie
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], //设置所允许的HTTP请求方法
    allowHeaders: ["Content-Type", "Authorization", "Accept"], //设置服务器支持的所有头信息字段
    exposeHeaders: ["WWW-Authenticate", "Server-Authorization"], //设置获取其他自定义字段
  })
);

// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));

app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

// logger
app.use(async (ctx, next) => {
  log4js.info(
    ctx.request.url +
      " " +
      JSON.stringify(
        ctx.request.method === "GET" ? ctx.request.query : ctx.request.body
      )
  );

  await next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 200;
      ctx.body = Util.fail({}, "Token认证失败", Util.CODE.AUTH_ERROR);
    } else {
      throw err;
    }
  });
});

// 中间件，验证token
app.use(
  koaJwt({ secret: SECRET }).unless({
    path: [
      /\/login/,
      /\/regist/,
      /\/refresh/,
      /\/getValidateImg/,
      /\/sendEmailCode/,
    ],
  })
);
// routes
// router.prefix("/api");

router.use(users.routes(), users.allowedMethods());

app.use(router.routes(), router.allowedMethods());

// error-handling
app.on("error", (err, ctx) => {
  log4js.error(err.stack);
});

module.exports = app;
