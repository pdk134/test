// 子弹
class Projectile {
  constructor(x, y, vx, vy, damage, hits) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.damage = damage
    this.hits = hits        // 可命中的敌人数量（pierce+1）
    this.radius = 5
    this.life = 2.2
    this.dead = false
    this.hit = new Set()    // 已命中的敌人，避免重复结算
  }

  update(dt, game) {
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.life -= dt
    if (this.life <= 0 || this.x < -30 || this.x > game.w + 30 || this.y < -30 || this.y > game.h + 30) {
      this.dead = true
      return
    }
    for (const e of game.enemies) {
      if (e.dead || this.hit.has(e.id)) continue
      if (Math.hypot(this.x - e.x, this.y - e.y) < this.radius + e.radius) {
        e.hurt(this.damage, game)
        this.hit.add(e.id)
        this.hits--
        if (this.hits <= 0) { this.dead = true; break }
      }
    }
  }
}

module.exports = Projectile
