/**
 * Supabase 云端配置
 *
 * ⚠️ 环境隔离：**开发与生产使用两个独立的 Supabase 项目**，互不影响。
 *
 *   生产 (main)    → wyuhxtnchkndkrsfknlh   表 progress
 *   开发 (nanana)  → jyytfphsldxmmxqltqvp   表 progress
 *
 * 之所以不用「同项目不同表」：同步采用「只升不降」的合并策略，一旦两边共用一张表，
 * 测试数据会被合并进去，而且**无法通过正常同步再清除**（并集 / 取大，不做删除）。
 * 分成两个项目后，Auth 用户表也一并隔离，dev 上注册测试账号不会污染生产。
 *
 * 说明：
 * - url / anonKey 是 Supabase 项目的公开信息，anon key 只代表「未登录匿名角色」，
 *   设计上就是放在前端代码里的；真正的安全边界是 progress 表的 RLS 策略（每人只能读写自己的那一行）。
 * - 千万不要填 service_role / secret keys，那类 key 会绕过 RLS，泄露后任何人可读写全表。
 * - 临时想换项目：直接改这个文件即可（曾经有个「账号页高级面板」的本机覆盖入口，
 *   因切分支不会失效、容易误连到别的项目，已下线并在启动时自动清理该残留键）。
 *   账号页会顶行显示当前项目 ref 与表名，用它来确认自己在哪个环境。
 */
window.SUPABASE_CONFIG = {
  // 开发环境（nanana 分支）。生产环境见 main 分支的 config.js
  url: 'https://jyytfphsldxmmxqltqvp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5eXRmcGhzbGR4bW14cWx0cXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTEwMjEsImV4cCI6MjEwNzg4NzAyMX0.-XMvA5peX95a11gccCxoSZAn94FFssRWmrdSaL5fhkA',
  table: 'progress'
};