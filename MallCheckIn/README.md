# 商场打卡小程序

一个"定位辅助 + 手动确认"的商场打卡小程序。核心用到了**空间计算**：通过 Haversine 公式计算用户定位与商场坐标的距离。

## 技术栈

| 部分 | 技术 |
| --- | --- |
| 后端 | Go（标准库 net/http，零第三方依赖） |
| 前端 | 微信小程序 |
| 存储 | JSON 文件持久化（`backend/data/checkins.json`） |

## 项目结构

```
MallCheckIn/
├── backend/                  # Go 后端
│   ├── main.go               # 入口 + 路由
│   ├── geo.go                # Haversine 距离计算
│   ├── store.go              # 数据模型 + 存储
│   ├── handlers.go           # HTTP API
│   └── data/checkins.json    # 打卡记录（自动生成）
└── miniprogram/              # 微信小程序
    ├── app.js / app.json     # 全局配置（baseUrl 在这里改）
    └── pages/
        ├── index/            # 首页：定位 + 商场列表 + 打卡
        └── records/          # 打卡记录
```

## 快速开始

### 1. 启动后端

```bash
cd backend
go run .
```

启动后监听 `http://localhost:8080`。

### 2. 打开小程序

1. 用**微信开发者工具**导入 `miniprogram/` 目录
2. AppID 选择"测试号"（`touristappid` 已配置）
3. 项目配置已关闭域名校验（`urlCheck: false`），可直接请求本地后端
4. 首页会自动获取定位并列出附近商场（按距离排序）
5. 点击"打卡"→ 确认距离 → 打卡成功

> 真机调试时：把 `app.js` 里的 `baseUrl` 改成电脑的局域网 IP，如 `http://192.168.1.100:8080`，并确保手机和电脑同一网络。

## API 一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/malls?lat=&lng=` | 商场列表，带距离并按距离排序 |
| POST | `/api/checkin` | 打卡，请求体 `{"mall_id":1,"lat":39.9,"lng":116.4}` |
| GET | `/api/checkins` | 打卡记录（倒序） |

## 后续可扩展方向

- 商场数据接入地图 API（如高德/腾讯位置服务）实现动态添加
- 增加用户系统（微信登录），打卡归属到人
- 改用 SQLite/PostgreSQL 持久化
- 增加打卡统计（月度报表、足迹地图）
