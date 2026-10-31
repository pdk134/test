// 升级卡牌池：新技能 / 强化现有技能，每级三选一
// apply 接收 { player, game }
const CARD_POOL = [
  { id: 'multi', kind: 'new', name: '连锁闪电', desc: '雷电链可多跳跃 1 个敌人（最多8）', weight: 1,
    apply(c) { c.player.chainCount = Math.min(c.player.chainCount + 1, 8) } },
  { id: 'ats', kind: 'upgrade', name: '急速射击', desc: '攻击速度 +18%', weight: 1,
    apply(c) { c.player.attackInterval *= 0.82 } },
  { id: 'dmg', kind: 'upgrade', name: '伤害提升', desc: '伤害 +25%', weight: 1,
    apply(c) { c.player.damage *= 1.25 } },
  { id: 'spd', kind: 'upgrade', name: '疾步', desc: '移动速度 +12%', weight: 1,
    apply(c) { c.player.moveSpeed *= 1.12 } },
  { id: 'rng', kind: 'upgrade', name: '射程扩展', desc: '攻击射程 +15%', weight: 1,
    apply(c) { c.player.range *= 1.15 } },
  { id: 'prc', kind: 'new', name: '电弧扩散', desc: '雷电链跳跃范围 +25%', weight: 1,
    apply(c) { c.player.chainRange *= 1.25 } },
  { id: 'hp', kind: 'upgrade', name: '强健体魄', desc: '最大生命 +25 并治疗', weight: 1,
    apply(c) { c.player.maxHp += 25; c.player.hp = Math.min(c.player.maxHp, c.player.hp + 25) } },
  { id: 'crit', kind: 'new', name: '暴击', desc: '暴击率 +10%', weight: 1,
    apply(c) { c.player.critChance = Math.min(0.9, c.player.critChance + 0.1) } },
  { id: 'xp', kind: 'upgrade', name: '经验精通', desc: '经验获取 +20%', weight: 1,
    apply(c) { c.player.xpMult *= 1.2 } },
  { id: 'ally', kind: 'new', name: '召唤伙伴', desc: '获得 1 名 NPC 伙伴助战', weight: 1,
    apply(c) { c.game.addCompanion() } }
]

module.exports = { CARD_POOL }
