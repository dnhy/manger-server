const router = require("koa-router")();
const User = require("../models/userSchema");
const Counter = require("../models/counterSchema");
const Util = require("../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const { uuid } = require("uuidv4");
const { sendEmail } = require("../utils/sendEmail");
const { captchaMap, genSvgCaptcha } = require("../utils/svgCaptcha");

const { SECRET, SECRETREFRESH } = require("../config/options");

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
  ctx.body = Util.success(payload, "获取用户信息成功");
});

router.get("/getUserInfo2", async (ctx) => {
  const payload = ctx.state.user;
  ctx.body = Util.success(payload, "获取用户信息成功");
});

router.get("/refresh", async (ctx) => {
  try {
    const token = ctx.request.headers.authorization.split(" ")[1];
    const payload = jwt.verify(token, SECRETREFRESH);
    if (payload) {
      const { _id, userName, userEmail } = payload;
      const { token, refreshToken } = Util.generateToken(
        { _id, userName, userEmail },
        SECRET,
        SECRETREFRESH,
        "1h",
        "1d"
      );
      ctx.body = Util.success({ token, refreshToken }, "刷新token成功");
    }
  } catch (error) {
    ctx.body = Util.fail(error, "刷新token失败");
  }
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

    if (result) {
      const res = result.toObject();
      const { token, refreshToken } = Util.generateToken(
        res,
        SECRET,
        SECRETREFRESH,
        "1h",
        "1d"
      );
      ctx.body = Util.success({ token, refreshToken }, "登录成功");
    } else {
      ctx.body = Util.fail(
        result,
        "账号或秘密不正确",
        Util.CODE.USER_ACCOUNT_ERROR
      );
    }
  } catch (error) {
    ctx.body = Util.fail(error, "");
  }
});

router.post("/regist", async (ctx) => {
  const { userName, userPwd, userEmail } = ctx.request.body;
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

router.get("/getValidateImg", (ctx) => {
  const { data, key } = genSvgCaptcha();

  ctx.set("Cache-Control", "no-store");
  ctx.set("Pragma", "no-cache");
  // ctx.set("Content-Type", "image/svg+xml");
  const obj = {
    captchaEnabled: true, // 是否开启验证码
    img: data,
    uuid: uuid(),
  };

  ctx.body = Util.success(obj, "获取图形验证码成功!");

  // 将验证码图片返回给客户端
  ctx.cookies.set("captcha_key", key, {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
  }); // 将key存储到cookie中，供后续验证使用
});

router.get("/sendEmailCode/:vcode", async (ctx) => {
  const { vcode } = ctx.params;
  const { email } = ctx.query;

  if (!email) {
    ctx.body = Util.fail("", "请输入邮箱");

    return;
  }
  if (!Util.testEmail(email)) {
    ctx.body = Util.fail("", "邮箱格式不正确");

    return;
  }

  if (!vcode) {
    ctx.body = Util.fail("", "请输入验证码");

    return;
  }

  const captchaKey = ctx.cookies.get("captcha_key");
  const storedCaptcha = captchaMap.get(captchaKey);

  if (storedCaptcha?.toLowerCase() !== vcode?.toLowerCase()) {
    ctx.body = Util.fail("", "图形验证码错误!");
    return;
  }
  const code = Util.randomString(4);
  const content = `<p>重置密码的验证码为：<span style="color:lightskyblue;font-size:20px">${code}</span><p>`;
  try {
    await sendEmail(email, "安全认证", content);
    ctx.body = Util.success("", "验证码已发送到您的邮箱!");
  } catch (error) {
    ctx.body = Util.fail(error, "验证码发送失败!");
  }
});

module.exports = router;

// 授权码
// xafeukwkmovagehc
