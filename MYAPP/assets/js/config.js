/**
 * Supabase 云端配置（已内置默认项目，开箱即用，无需手动填写）
 *
 * 说明：
 * - url / anonKey 是 Supabase 项目的公开信息，anon key 只代表「未登录匿名角色」，
 *   设计上就是放在前端代码里的；真正的安全边界是 progress 表的 RLS 策略（每人只能读写自己的那一行）。
 * - 千万不要填 service_role / secret keys，那类 key 会绕过 RLS，泄露后任何人可读写全表。
 * - 想换成自己的 Supabase 项目：直接改这里，或在「账号」页的「高级」里临时覆盖（存本机 localStorage）。
 */
window.SUPABASE_CONFIG = {
  url: 'https://wyuhxtnchkndkrsfknlh.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dWh4dG5jaGtuZGtyc2ZrbmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTI3NDYsImV4cCI6MjEwNjgyODc0Nn0.XUzq6y9IfC6HTdGXY6UrXI2Jb2tGbbzZ8yeRfIpUUyQ'
};
