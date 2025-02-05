const captchaMap = new Map();
const svgCaptcha = require("svg-captcha");

function genSvgCaptcha() {
  const { text, data } = svgCaptcha.create({
    size: 4, // 验证码长度
    width: 130, // 验证码图片宽度
    height: 40, // 验证码图片高度
    fontSize: 30, // 验证码字体大小
    noise: Math.floor(Math.random() * 5), //干扰线条数目_随机0-5条 可以增加一些噪点，但不影响背景
    color: true, //验证码字符是否有颜色，默认是没有，但是如果设置了背景颜色，那么默认就是有字符颜色
    background: "#f1f5f8", //背景色
    ignoreChars: "0o1i", // 避免混淆字符
  });

  // 存储验证码到Map中，实际生产环境中建议使用Redis等存储
  const key = Math.random().toString(36).substring(2); // 生成随机的key

  captchaMap.set(key, text);

  return { data, key };
}

module.exports = { captchaMap, genSvgCaptcha };
