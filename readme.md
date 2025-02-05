## 启动mongodb
sudo mongod -f /usr/local/etc/mongod.conf
sudo launchctl start org.mongodb.mongod

## 关闭
killall mongod   

## 配置文件
```
// mongod.conf
net:
  port: 27017
storage:
  dbPath: "/usr/local/data/db"
processManagement:
  fork: true
systemLog:
    path: "/usr/local/data/log/mongo.log"
    destination: file
    logAppend: true
    quiet: false
```

## mongoose查询结果对象
对象类型是document，不是普通的js对象，无法直接新增属性。
https://blog.csdn.net/weixin_39818813/article/details/126689641

## mongodb启动之后无法访问
需要开放服务器自带的ufw防火墙，腾讯云防火墙，配置bindIp:All
https://blog.csdn.net/wuyanshen2012/article/details/77198644

## 开机自启动配置
https://blog.csdn.net/tacity/article/details/104446461