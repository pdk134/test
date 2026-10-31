const Game = require('./game.js')
const loader = require('./assets.js')

// 预加载美术资源（缺失时回退矢量绘制）
// 丧尸美术已离线烘焙为透明 PNG（tools/_bake.py），运行时零像素处理，无白底风险
// 主链：4 帧走路表；缺失时回退静态透明图，最后矢量占位
loader.loadSheet('zombie', 'assets/zombie_walk.png', 4, { raw: true }).then((s) => {
  if (!s) return loader.load('zombie', 'assets/zombie.png')
})
// 主角/伙伴：放 assets/hero.png / assets/ally.png 即自动替换
loader.load('hero', 'assets/hero.png')
loader.load('ally', 'assets/ally.png')

// 创建主画布
const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const info = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync())
canvas.width = info.windowWidth
canvas.height = info.windowHeight

const game = new Game(canvas.width, canvas.height)

let last = Date.now()
function loop() {
  const now = Date.now()
  let dt = (now - last) / 1000
  last = now
  if (dt > 0.05) dt = 0.05 // 防止切后台回来后跳变
  game.update(dt)
  game.render(ctx)
  requestAnimationFrame(loop)
}

// 触摸分发（小游戏触点坐标为 clientX/clientY）
function pointOf(e) {
  const t = e.touches[0]
  if (!t) return null
  return { x: (t.x != null) ? t.x : t.clientX, y: (t.y != null) ? t.y : t.clientY }
}

wx.onTouchStart(e => {
  const p = pointOf(e)
  if (p) game.onTouch(p.x, p.y)
})

wx.onTouchMove(e => {
  const p = pointOf(e)
  if (p) game.onTouchMove(p.x, p.y)
})

loop()
