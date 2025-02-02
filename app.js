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
const Util = require("./utils/util");
const { SECRET } = require("./config/options");

// error handler
onerror(app);

require("./config/db");

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
app.use(koaJwt({ secret: SECRET }).unless({ path: [/\/login/, /\/regist/] }));
// routes
// router.prefix("/api");

router.use(users.routes(), users.allowedMethods());

app.use(router.routes(), router.allowedMethods());

// error-handling
app.on("error", (err, ctx) => {
  log4js.error(err.stack);
});

module.exports = app;
