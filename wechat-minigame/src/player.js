const { CONFIG } = require('./config.js')
const { clamp, dist } = require('./utils.js')
const { drawChibi } = require('./sprites.js')

// 主角：自动移动（绕最近敌人走位）+ 自动攻击
class Player {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.x = w / 2
    this.y = h / 2
    Object.assign(this, JSON.parse(JSON.stringify(CONFIG.player)))
    this.hp = this.maxHp
    this.level = 1
    this.xp = 0
    this.xpNeeded = CONFIG.level.base
    this.attackTimer = 0
  }

  update(dt, game) {
    const target = game.nearestEnemy(this.x, this.y)

    // 移动：仅由玩家触摸控制，点哪走到哪（拖动实时跟随），到达后停止
    if (game.moveTarget) {
      const dx = game.moveTarget.x - this.x
      const dy = game.moveTarget.y - this.y
      const len = Math.hypot(dx, dy) || 1
      if (len > 6) {
        this.x = clamp(this.x + (dx / len) * this.moveSpeed * dt, this.radius, this.w - this.radius)
        this.y = clamp(this.y + (dy / len) * this.moveSpeed * dt, this.radius, this.h - this.radius)
      } else {
        game.moveTarget = null // 到达目标点，停止（再次点击可重新指定）
      }
    }

    // 技能（雷电链）自动释放
    if (target) {
      this.attackTimer -= dt
      if (this.attackTimer <= 0) {
        this.attackTimer = this.attackInterval
        this.castLightning(game, target)
      }
    }
  }

  draw(ctx) {
    drawChibi(ctx, this.x, this.y, this.radius, '#5f27cd', '#ff9ff3', 'hero')
  }

  // 雷电链：锁定最近敌人，向周围连续跳跃，每跳锯齿闪电 + 电火花 + 伤害衰减
  castLightning(game, first) {
    const fx = game.effects
    let prev = { x: this.x, y: this.y }
    const hit = new Set()
    let dmg = this.damage
    let reach = this.range
    for (let k = 0; k < this.chainCount; k++) {
      let best = null, bestD = reach
      for (const e of game.enemies) {
        if (e.dead || hit.has(e.id)) continue
        const d = dist(prev.x, prev.y, e.x, e.y)
        if (d < bestD) { bestD = d; best = e }
      }
      if (!best) break
      hit.add(best.id)
      fx.bolt(prev.x, prev.y, best.x, best.y, '#bfe9ff', { segs: 7, jitter: 22 })
      fx.spark(best.x, best.y, '#bfe9ff', { count: 14, speed: 200, life: 0.4, size: 3 })
      best.hurt(dmg, game)
      prev = best
      reach = this.chainRange
      dmg *= this.chainFalloff
    }
    if (hit.size > 0) {
      fx.shakeAdd(5, 0.12)
      fx.hitStopAdd(0.04)
    }
  }
}

module.exports = Player
