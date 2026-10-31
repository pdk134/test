// 通用工具
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

function clamp(v, a, b) {
  return v < a ? a : (v > b ? b : v)
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function randInt(a, b) {
  return Math.floor(rand(a, b + 1))
}

// 圆角矩形路径
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

module.exports = { dist, clamp, rand, randInt, roundRect }
