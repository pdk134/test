# 架构术语学习通

像背单词一样学习中文架构术语的轻量 Web 应用。零依赖、无需构建，双击即可用。

## 运行

三种方式任选：

1. 直接双击 `index.html`（数据存在浏览器 localStorage，可用）
2. 本地起服务（推荐，便于调试）：

```bash
cd MYAPP
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

3. **手机离线使用**：先生成单文件版，再传到手机

```bash
python build_standalone.py     # 生成 standalone.html（全部 CSS/JS 已内联）
```

把 `standalone.html` 通过微信/QQ 文件传输助手或数据线发到手机，用浏览器打开即可（无需网络）。
每次更新术语库后重新执行一次打包脚本。

> iOS 若无法用浏览器打开本地 HTML，可退回方式 2（同 WiFi 下访问 `http://电脑IP:8000`）。
> 学习进度存在各自浏览器本地，手机与电脑不互通，可用「设置 → 导出/导入 JSON」迁移。

## 部署到 GitHub Pages（手机随时访问）

仓库根目录已放好工作流 `.github/workflows/pages.yml`，它会把 `MYAPP` 目录作为站点根发布。

一次性配置（只需做一次）：

1. 推送代码到 GitHub（当前仓库 `git@github.com:pdk134/test.git`）
2. 打开仓库 **Settings → Pages → Build and deployment**，把 Source 改为 **GitHub Actions**
3. 之后每次往默认分支（`main`）push／合并，都会自动部署

访问地址：`https://pdk134.github.io/test/`

手机上打开该地址即可；建议用浏览器「添加到主屏幕」，之后像 App 一样点开就学。

日常更新流程（开发在 `nanana`，发布走 `main`）：

```bash
git checkout nanana
git add MYAPP .github
git commit -m "更新术语库"
git push origin nanana          # 不会触发部署
# 在 GitHub 上开 PR 合并到 main，合并后自动部署
```

> `github-pages` 环境默认只允许默认分支部署，所以工作流只在 `main` 上触发。

> 部署走的是 Actions，不需要 Jekyll；页面内资源都是相对路径，放在 `https://用户名.github.io/仓库名/` 子路径下也能正常工作。

## 目录结构

```
MYAPP/
├── index.html              页面结构
├── build_standalone.py      打包生成手机用的单文件版
├── standalone.html          打包产物（生成后可独立分发）
├── assets/
│   ├── css/style.css       样式（深色 / 浅色主题）
│   └── js/
│       ├── terms.js        术语库（要加知识点就改这里）
│       ├── store.js        localStorage 存储层
│       ├── srs.js          间隔重复调度算法
│       ├── config.js       Supabase 默认值（可留空）
│       └── sync.js         云端账号与进度同步
│       └── app.js          页面交互逻辑
└── README.md
```

## 已实现功能

| 模块 | 能力 |
| --- | --- |
| 学习 | 闪卡翻转（正面术语 → 背面释义），三档评分：不认识 / 模糊 / 认识 |
| 调度 | 间隔重复：按记忆等级自动安排下次复习时间，今日到期卡片优先出队 |
| 词库 | 关键词搜索、分类筛选、状态筛选（未学习 / 学习中 / 已掌握）、术语详情弹窗 |
| 测试 | 选择题，术语 ↔ 释义 双向随机出题，答错自动进难词本 |
| 统计 | 掌握分布环形图、近 7 日学习量、各分类掌握进度、难词本 |
| 设置 | 每日新词数 / 复习上限、自动朗读、主题切换、学习记录导出导入与清空 |

快捷键：`空格` 翻卡、`1/2/3` 评分、`Esc` 关闭弹窗。

## 间隔重复规则（`assets/js/srs.js`）

- 记忆等级 `box` 对应复习间隔（天）：`1, 2, 4, 7, 15, 30, 60, 120`
- **不认识**：box 归零，10 分钟后重来，遗忘次数 +1
- **模糊**：间隔按当前等级 ×0.9 倍收缩，至少 1 天后再来
- **认识**：等级 +1，间隔按等级 × 熟练度系数放大
- `box >= 4`（间隔 ≥ 7 天）视为「已掌握」

## 添加术语

往 `assets/js/terms.js` 的数组里追加对象即可，页面会自动识别新分类、更新统计，**不需要改动其他代码**：

```js
{
  t: '幂等',                 // 术语（唯一）
  en: 'Idempotency',         // 英文 / 缩写
  c: '一致性事务',            // 分类（随意新增）
  lv: 2,                    // 难度：1 基础 / 2 进阶 / 3 高阶
  d: '执行一次与多次结果完全相同。',
  p: ['要点一', '要点二'],    // 背面要点列表
  e: '重复点击支付只扣一次款。',
  r: ['重试', '消息队列']     // 相关术语（填中文术语名，可跳转）
}
```

## 云端账号同步（可选）

手机和电脑登录同一账号即可同步进度。用的是 Supabase（免费额度足够个人使用），密钥直接填在站点「账号」页面，不必改代码重新部署。

**1. 建 Supabase 项目**：supabase.com 新建（Free 计划即可）。

**2. SQL Editor 里执行建表语句**（含 RLS，保证每人只能读写自己的数据）：

```sql
create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at bigint not null
);

alter table public.progress enable row level security;

create policy "own_progress" on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**3. 取密钥**：Settings → API，复制 **Project URL** 和 **anon public key**。

**4. 关掉邮箱验证（推荐）**：Authentication → Sign In / Providers → Email，关闭 *Confirm email*，否则注册后要先点邮件链接。

**5. 站点配置**：打开「账号」页 → 填入 URL 与 anon key → 保存 → 用邮箱 + 密码注册/登录。

**6. 另一台设备**：浏览器打开同一站点，填同样的配置（或什么都不填也行，配置只存在本机），登录同一账号即可。

同步规则：
- 本机有改动 → 2.5 秒后自动上传
- 切回页面 / 每 2 分钟 → 自动拉取云端最新数据
- 两端冲突时以 `updatedAt` 时间戳最新的一份为准（last-write-wins）
- 未配置或未登录时完全等同之前的纯本地模式

> anon key 是设计为可公开的前端密钥，安全性由上面的 RLS 策略保证；请不要把 service_role key 填进去。

## 数据说明

- 学习记录保存在浏览器 `localStorage`（键名 `arch-term-trainer-v1`），不上传任何服务器。
- 换设备或清理浏览器前，请在「设置 → 数据」中导出 JSON 备份。
