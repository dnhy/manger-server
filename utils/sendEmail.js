const nodemailer = require("nodemailer");

//创建一个SMTP客户端配置对象
const transporter = nodemailer.createTransport({
  // 默认支持的邮箱服务包括：”QQ”、”163”、”126”、”iCloud”、”Hotmail”、”Yahoo”等
  service: "QQ",
  auth: {
    // 发件人邮箱账号
    user: "1240791903@qq.com",
    //发件人邮箱的授权码 需要在自己的邮箱设置中生成,并不是邮件的登录密码
    pass: "xafeukwkmovagehc",
  },
});
const sendEmail = (toUserEmail, title, content) => {
  return new Promise((resolve, reject) => {
    // 配置收件人信息
    const receiver = {
      // 发件人 邮箱  '昵称<发件人邮箱>'
      from: `1240791903@qq.com`,
      // 主题
      subject: title,
      // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
      to: toUserEmail,
      // 可以使用html标签
      html: content,
    };

    // 发送邮件
    transporter.sendMail(receiver, (error, info) => {
      if (error) {
        reject({
          code: 0,
          msg: error,
        });
      }
      transporter.close();
      resolve({
        code: 200,
        msg: "success",
      });
    });
  });
};
module.exports = {
  sendEmail,
};
