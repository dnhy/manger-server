const router = require("koa-router")();
const User = require("../models/userSchema");
const Counter = require("../models/counterSchema");
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
      const token = jwt.sign({ data: res }, SECRET, { expiresIn: "1d" });
      ctx.body = Util.success({ token }, "登录成功");
    } else {
      ctx.body = Util.fail(result, "账号或秘密不正确", Util.CODE.AUTH_ERROR);
    }
  } catch (error) {
    ctx.body = Util.fail("", error);
  }
});

router.post("/regist", async (ctx) => {
  const { userName, userPwd, userEmail } = ctx.request.body;
  console.log("userName :", userName, userEmail);
  if (!userName || !userPwd || !userEmail) {
    ctx.body = Util.fail("", "参数错误", Util.CODE.PARAM_ERROR);
    return;
  }

  const res = await User.findOne(
    { $or: [{ userName }, { userEmail }] },
    "_id userName userEmail"
  );

  if (res) {
    ctx.body = Util.fail(
      {},
      `系统检测到重复用户，信息如下：${res.userName} - ${res.userEmail}`
    );
    return;
  }

  try {
    const doc = await Counter.findOneAndUpdate(
      { _id: "userId" },
      { $inc: { sequence_value: 1 } },
      { new: true }
    );

    const user = new User({
      userId: doc.sequence_value,
      userName,
      userPwd: md5(userPwd),
      userEmail,
    });

    user.save();

    ctx.body = Util.success("", "注册成功！");
  } catch (error) {
    ctx.body = Util.fail(error, "注册失败！");
  }
});

module.exports = router;
