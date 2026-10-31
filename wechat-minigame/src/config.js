// 游戏全局配置（俯视生存竞技场 / 升级选卡）
const CONFIG = {
  player: {
    radius: 16,
    maxHp: 100,
    moveSpeed: 130,     // px/s
    damage: 10,
    attackInterval: 0.6, // s 技能冷却
    range: 230,         // 主目标锁定射程
    chainCount: 4,      // 雷电链最多跳跃数
    chainRange: 180,    // 每跳可命中周围敌人的半径
    chainFalloff: 0.82, // 每跳伤害衰减
    projectileSpeed: 340,
    projectileCount: 1, // 一次发射弹丸数
    pierce: 0,          // 额外穿透数
    critChance: 0,
    critMult: 2,
    xpMult: 1
  },
  enemy: {
    radius: 14,
    baseHp: 20,
    hpPerStage: 14,
    speed: 52,
    speedPerStage: 5,
    damage: 8,
    contactCd: 0.5,
    xp: 3
  },
  level: {
    base: 40,      // 升到第 2 级所需经验
    ratio: 1.35    // 每级所需经验递增比率（梯度上升：base * ratio^(等级-1)）
  },
  spawn: {
    baseInterval: 1.2,    // 第1关刷怪间隔(s)
    minInterval: 0.25,
    perStageReduce: 0.14, // 每关缩短
    burst: 1              // 每次刷几只
  },
  stage: {
    count: 5,             // 总关卡数
    duration: 25,         // 每关时长(s)
    companionFromStage: 3,// 第3关起自动获得1名NPC伙伴（前2关单人）
    maxCompanions: 3
  },
  colors: {
    bg: '#1b1b2b',
    player: '#4CC9F0',
    companion: '#80ED99',
    enemy: '#F4595F',
    projectile: '#FFD166',
    hp: '#F4595F',
    xp: '#4CC9F0',
    card: '#2a2a40',
    cardBorder: '#FFD166'
  }
}

module.exports = { CONFIG }
