const { CONFIG } = require('./config.js')
const { dist, clamp } = require('./utils.js')
const { drawZombie } = require('./sprites.js')

let NEXT_ID = 1

// 敌人：从四周生成，向主角移动，接触造成伤害
class Enemy {
  constructor(x, y, stage) {
    this.id = NEXT_ID++
    this.x = x
    this.y = y
    this.radius = CONFIG.enemy.radius
    this.maxHp = CONFIG.enemy.baseHp + (stage - 1) * CONFIG.enemy.hpPerStage
    this.hp = this.maxHp
    this.speed = CONFIG.enemy.speed + (stage - 1) * CONFIG.enemy.speedPerStage
    this.damage = CONFIG.enemy.damage
    this.xp = CONFIG.enemy.xp
    this.dead = false
    this.contactTimer = 0
    this.faceX = 0
    this.faceY = 1
    this.hitFlash = 0       // 受击泛白计时
    this.stun = 0          // 雷电链短暂停顿
  }

  update(dt, game) {
    const p = game.player
    if (this.hitFlash > 0) this.hitFlash -= dt
    if (this.stun > 0) this.stun -= dt
    if (p.hp <= 0) return
    const dx = p.x - this.x
    const dy = p.y - this.y
    const len = Math.hypot(dx, dy) || 1
    this.faceX = dx / len
    this.faceY = dy / len
    if (this.stun <= 0) {
      this.x += this.faceX * this.speed * dt
      this.y += this.faceY * this.speed * dt
    }

    this.contactTimer -= dt
    if (len < this.radius + p.radius && this.contactTimer <= 0) {
      p.hp -= this.damage
      this.contactTimer = CONFIG.enemy.contactCd
    }
  }

  hurt(d, game) {
    this.hp -= d
    this.hitFlash = 0.14
    this.stun = 0.12
    if (game && game.effects) {
      game.effects.spark(this.x, this.y, '#bfe9ff', { count: 6, speed: 150, life: 0.3, size: 2.5 })
    }
    if (this.hp <= 0) this.dead = true
  }

  draw(ctx) {
    drawZombie(ctx, this)
  }
}

module.exports = Enemy
