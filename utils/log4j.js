const log4js = require("log4js");

log4js.configure({
  appenders: {
    console: {
      type: "console",
    },
    info: { type: "file", filename: "logs/all-logs.log" },
    error: {
      type: "dateFile", //按照pattern中定义的事件滚动备份
      filename: "logs/errorlogs", //初始日志文件名
      pattern: "yyyy-MM-dd.log", //日志滚动模式，只存储当前配置最小单位时间的日志文件。如果没有发生写入，则不会发生日志滚动
      alwaysIncludePattern: true, //filename+pattern
      // keepFileExt: true,
    },
  },
  categories: {
    default: { appenders: ["console", "info"], level: "debug" },
    error: { appenders: ["console", "error"], level: "error" },
  },
});

exports.debug = (content) => {
  const logger = log4js.getLogger();
  logger.level = "debug"; //定义会打印的日志的最低等级
  logger.debug(content);
};

exports.error = (content) => {
  const logger = log4js.getLogger("error");
  logger.level = "error";
  logger.error(content);
};

exports.info = (content) => {
  const logger = log4js.getLogger();
  logger.level = "info";
  logger.info(content);
};
