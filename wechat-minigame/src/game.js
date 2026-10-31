const { CONFIG } = require('./config.js')
const { dist, clamp, roundRect } = require('./utils.js')
const Player = require('./player.js')
const Enemy = require('./enemy.js')
const Companion = require('./companion.js')
const { CARD_POOL } = require('./skills.js')
const Effects = require('./effects.js')

// 游戏主体：状态机 + 刷怪 + 升级选卡 + 渲染 + 触摸分发
class Game {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.start()
  }

  start() {
    this.player = new Player(this.w, this.h)
    this.enemies = []
    this.projectiles = []
    this.companions = []
    this.effects = new Effects()  // 程序化特效（雷电/粒子/震屏/顿帧）
    this.stage = 1
    this.stageTimer = CONFIG.stage.duration
    this.spawnTimer = 0.5
    this.score = 0
    this.state = 'playing'       // playing | levelup | win | lose
    this.cardChoices = []
    this.cardRects = []
    this.pendingLevelUps = 0
    this.moveTarget = null       // 手动移动目标（触摸/拖拽时设置）
  }

  // ---- 查询 ----
  nearestEnemy(x, y) {
    let best = null
    let bestD = Infinity
    for (const e of this.enemies) {
      if (e.dead) continue
      const d = dist(x, y, e.x, e.y)
      if (d < bestD) { bestD = d; best = e }
    }
    return best
  }

  addCompanion() {
    if (this.companions.length < CONFIG.stage.maxCompanions) {
      this.companions.push(new Companion(this))
    }
  }

  // ---- 经验 / 升级 ----
  gainXp(amount) {
    this.player.xp += amount * this.player.xpMult
  }

  openCards() {
    this.cardChoices = this.rollCards()
    this.cardRects = []
    this.state = 'levelup'
  }

  rollCards() {
    const pool = CARD_POOL.filter(c => {
      if (c.id === 'ally' && this.companions.length >= CONFIG.stage.maxCompanions) return false
      return true
    })
    const chosen = []
    const bag = pool.slice()
    while (chosen.length < 3 && bag.length > 0) {
      const total = bag.reduce((s, c) => s + c.weight, 0)
      let r = Math.random() * total
      let idx = 0
      for (let i = 0; i < bag.length; i++) {
        r -= bag[i].weight
        if (r <= 0) { idx = i; break }
      }
      chosen.push(bag[idx])
      bag.splice(idx, 1)
    }
    return chosen
  }

  chooseCard(i) {
    const card = this.cardChoices[i]
    if (!card) return
    card.apply({ player: this.player, game: this })
    this.pendingLevelUps--
    if (this.pendingLevelUps > 0) {
      this.openCards()
    } else {
      this.state = 'playing'
    }
  }

  // ---- 关卡推进 ----
  nextStage() {
    this.stage++
    if (this.stage > CONFIG.stage.count) {
      this.state = 'win'
      return
    }
    this.stageTimer = CONFIG.stage.duration
    // 后期关卡自动获得 1 名伙伴（前几关单人）
    if (this.stage >= CONFIG.stage.companionFromStage && this.companions.length < CONFIG.stage.maxCompanions) {
      this.addCompanion()
    }
  }

  // ---- 主更新 ----
  update(dt) {
    // 非战斗状态也让特效继续老化（闪电/粒子淡出）
    if (this.state !== 'playing') { this.effects.update(dt); return }
    // 命中顿帧：冻结实体、保留特效动画，强化打击感
    if (this.effects.hitStop > 0) {
      this.effects.hitStop -= dt
      this.effects.update(dt)
      return
    }

    // 刷怪
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      const interval = Math.max(
        CONFIG.spawn.minInterval,
        CONFIG.spawn.baseInterval - (this.stage - 1) * CONFIG.spawn.perStageReduce
      )
      this.spawnTimer = interval
      for (let i = 0; i < CONFIG.spawn.burst; i++) this.spawnEnemy()
    }

    // 关卡计时
    this.stageTimer -= dt
    if (this.stageTimer <= 0) this.nextStage()

    this.player.update(dt, this)
    for (const c of this.companions) c.update(dt, this)
    for (const e of this.enemies) e.update(dt, this)
    for (const p of this.projectiles) p.update(dt, this)

    // 清理死亡敌人并结算经验
    const alive = []
    for (const e of this.enemies) {
      if (e.dead) {
        this.effects.burst(e.x, e.y, '#6ab04c') // 死亡碎裂特效
        this.gainXp(e.xp)
        this.score++
      } else {
        alive.push(e)
      }
    }
    this.enemies = alive
    this.projectiles = this.projectiles.filter(p => !p.dead)
    this.effects.update(dt)

    // 升级检测
    if (this.player.xp >= this.player.xpNeeded) {
      this.player.level++
      this.player.xp -= this.player.xpNeeded
      this.player.xpNeeded = Math.floor(CONFIG.level.base * Math.pow(CONFIG.level.ratio, this.player.level - 1))
      this.pendingLevelUps++
      this.openCards()
    }

    // 失败检测
    if (this.player.hp <= 0) {
      this.player.hp = 0
      this.state = 'lose'
    }
  }

  spawnEnemy() {
    // 从屏幕四边随机生成
    const edge = Math.floor(Math.random() * 4)
    let x, y
    if (edge === 0) { x = Math.random() * this.w; y = -20 }
    else if (edge === 1) { x = this.w + 20; y = Math.random() * this.h }
    else if (edge === 2) { x = Math.random() * this.w; y = this.h + 20 }
    else { x = -20; y = Math.random() * this.h }
    this.enemies.push(new Enemy(x, y, this.stage))
  }

  // ---- 触摸 ----
  onTouch(x, y) {
    if (this.state === 'levelup') {
      for (let i = 0; i < this.cardRects.length; i++) {
        const r = this.cardRects[i]
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
          this.chooseCard(i)
          return
        }
      }
    } else if (this.state === 'win' || this.state === 'lose') {
      this.start()
    } else if (this.state === 'playing') {
      this.moveTarget = { x, y }
    }
  }

  onTouchMove(x, y) {
    if (this.state === 'playing') this.moveTarget = { x, y }
  }

  // ---- 渲染 ----
  render(ctx) {
    ctx.fillStyle = CONFIG.colors.bg
    ctx.fillRect(0, 0, this.w, this.h)

    // 世界层（受屏幕震动影响）
    const s = this.effects.shakeOffset()
    ctx.save()
    ctx.translate(s.x, s.y)

    // 敌人（丧尸）
    for (const e of this.enemies) e.draw(ctx)

    // 子弹
    ctx.fillStyle = CONFIG.colors.projectile
    for (const p of this.projectiles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 伙伴（二次元）
    for (const c of this.companions) c.draw(ctx)

    // 主角（二次元）
    this.player.draw(ctx)

    // 手动移动目标指示
    if (this.moveTarget) {
      ctx.strokeStyle = '#ffffff88'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.moveTarget.x, this.moveTarget.y, 18, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 特效层（加色发光：闪电 + 粒子），盖在世界之上
    this.effects.draw(ctx)

    ctx.restore()

    this.renderHUD(ctx)

    if (this.state === 'levelup') this.renderCards(ctx)
    else if (this.state === 'win' || this.state === 'lose') this.renderEnd(ctx)
  }

  renderHUD(ctx) {
    const pad = this.w * 0.04
    // 血条
    ctx.fillStyle = '#00000055'
    ctx.fillRect(pad, pad, this.w - pad * 2, 14)
    ctx.fillStyle = CONFIG.colors.hp
    ctx.fillRect(pad, pad, (this.w - pad * 2) * clamp(this.player.hp / this.player.maxHp, 0, 1), 14)
    // 经验条
    ctx.fillStyle = '#00000055'
    ctx.fillRect(pad, pad + 18, this.w - pad * 2, 8)
    ctx.fillStyle = CONFIG.colors.xp
    ctx.fillRect(pad, pad + 18, (this.w - pad * 2) * clamp(this.player.xp / this.player.xpNeeded, 0, 1), 8)

    // 文本信息
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(this.w * 0.04)}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(`Lv.${this.player.level}`, pad, pad + 50)
    ctx.textAlign = 'center'
    ctx.fillText(`第 ${this.stage}/${CONFIG.stage.count} 关`, this.w / 2, pad + 50)
    ctx.textAlign = 'right'
    ctx.fillText(`伙伴 ${this.companions.length}  击杀 ${this.score}`, this.w - pad, pad + 50)
    ctx.textAlign = 'left'
  }

  renderCards(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    ctx.fillRect(0, 0, this.w, this.h)

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.floor(this.w * 0.06)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('升级！选择一张卡牌', this.w / 2, this.h * 0.16)
    ctx.textAlign = 'left'

    const m = this.w * 0.08
    const bw = this.w - m * 2
    const bh = this.h * 0.16
    const gap = this.h * 0.03
    const startY = this.h * 0.24
    this.cardRects = []
    for (let i = 0; i < this.cardChoices.length; i++) {
      const y = startY + i * (bh + gap)
      const card = this.cardChoices[i]
      ctx.fillStyle = CONFIG.colors.card
      roundRect(ctx, m, y, bw, bh, 12)
      ctx.fill()
      ctx.strokeStyle = CONFIG.colors.cardBorder
      ctx.lineWidth = 2
      roundRect(ctx, m, y, bw, bh, 12)
      ctx.stroke()

      ctx.fillStyle = CONFIG.colors.cardBorder
      ctx.font = `bold ${Math.floor(this.w * 0.05)}px sans-serif`
      ctx.fillText(card.name, m + 18, y + bh * 0.42)
      ctx.fillStyle = '#cfd3e0'
      ctx.font = `${Math.floor(this.w * 0.038)}px sans-serif`
      ctx.fillText(card.desc, m + 18, y + bh * 0.74)
      this.cardRects.push({ x: m, y, w: bw, h: bh })
    }
  }

  renderEnd(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, this.w, this.h)
    ctx.fillStyle = this.state === 'win' ? CONFIG.colors.companion : CONFIG.colors.enemy
    ctx.font = `bold ${Math.floor(this.w * 0.08)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(this.state === 'win' ? '通关胜利！' : '挑战失败', this.w / 2, this.h * 0.4)
    ctx.fillStyle = '#fff'
    ctx.font = `${Math.floor(this.w * 0.045)}px sans-serif`
    ctx.fillText(`到达第 ${this.stage} 关 · 击杀 ${this.score}`, this.w / 2, this.h * 0.5)
    ctx.fillText('点击屏幕重新开始', this.w / 2, this.h * 0.58)
    ctx.textAlign = 'left'
  }
}

module.exports = Game
