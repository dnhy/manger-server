const router = require("koa-router")();
const User = require("../models/userSchema");
const Util = require("../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

const { SECRET } = require("../config/options");

router.prefix("/users");

router.get("/getUserInfo", async (ctx) => {
  // 方案1
  // try {
  //   const token = ctx.request.headers.authorization.split(" ")[1];
  //   const payload = jwt.verify(token, SECRET);

  //   if (payload) {
  //     ctx.body = Util.success(payload.data, "获取用户信息成功");
  //   }
  // } catch (error) {
  //   ctx.body = Util.fail({}, "Token认证失败", Util.CODE.AUTH_ERROR);
  // }

  // 方案2，直接从中间件获取token解析值
  const payload = ctx.state.user;
  ctx.body = Util.success(payload.data, "获取用户信息成功");
});

router.post("/login", async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    /**
     * 返回数据库指定字段，有三种方式
     * 1. 'userId userName userEmail state role deptId roleList'
     * 2. {userId:1,_id:0}
     * 3. select('userId userName')
     * 4. select({userId:1,_id:0})
     */
    const result = await User.findOne(
      { userName, userPwd: md5(userPwd) },
      { _id: 1, userName: 1, userEmail: 1 }
    );
    console.log("result :", result);

    if (result) {
      const res = result.toObject();
      const token = jwt.sign({ data: res }, SECRET, { expiresIn: 3 });
      ctx.body = Util.success({ token }, "登录成功");
    } else {
      ctx.body = Util.fail(result, "账号或秘密不正确", Util.CODE.AUTH_ERROR);
    }
  } catch (error) {
    ctx.body = Util.fail("", error);
  }
});

module.exports = router;
