const log4js = require("./log4j");
const jwt = require("jsonwebtoken");

const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001, // 参数错误
  USER_ACCOUNT_ERROR: 20001, //账号或密码错误
  USER_LOGIN_ERROR: 30001, // 用户未登录
  BUSINESS_ERROR: 40001, //业务请求失败
  AUTH_ERROR: 500001, // 认证失败或TOKEN过期
};
module.exports = {
  pager({ pageNum = 1, pageSize = 10 }) {
    pageNum *= 1;
    pageSize *= 1;
    const skipIndex = (pageNum - 1) * pageSize;
    return {
      page: {
        pageNum,
        pageSize,
      },
      skipIndex,
    };
  },
  success(data = {}, msg = "", code = CODE.SUCCESS) {
    log4js.debug(data);
    return {
      data,
      msg,
      code,
    };
  },
  fail(data = {}, msg = "", code = CODE.BUSINESS_ERROR) {
    log4js.error(msg);
    log4js.error(data);
    return {
      data,
      msg,
      code,
    };
  },
  CODE,
  generateToken(
    payload = {},
    secret,
    sectRef,
    expiresIn = "1h",
    expiresInRefresh = "1d"
  ) {
    console.log("payload :", payload);

    const token = jwt.sign(payload, secret, { expiresIn });
    const refreshToken = jwt.sign(payload, sectRef, {
      expiresIn: expiresInRefresh,
    });

    return { token, refreshToken };
  },
};
