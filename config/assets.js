/**
 * Asset แนวป่าผจญภัย
 * ต้นไม้/เต็นท์/หิน = Kenney Nature Kit (CC0)
 * หีบสมบัติ = Kenney Pirate Kit (CC0)
 * ผู้เล่น = RobotExpressive (CC0)
 */
export const ASSETS = {
  models: {
    player: { url: "assets/characters/robot.glb", type: "gltf", fallback: "robot", scale: 0.82, ground: false },
    npc: { url: "assets/characters/robot.glb", type: "gltf", fallback: "npc", scale: 0.85, ground: false },
    treasure: { url: "assets/nature/chest.glb", type: "gltf", fallback: "chest", scale: 2.2 },
    secretTreasure: { url: "assets/nature/chest.glb", type: "gltf", fallback: "secretChest", scale: 2.0 },
    flag: { url: "assets/nature/flag.glb", type: "gltf", fallback: "checkpoint", scale: 1.6 },
    tree: { url: "assets/nature/tree_oak.glb", type: "gltf", fallback: "tree", scale: 1.7 },
    treePine: { url: "assets/nature/tree_pine.glb", type: "gltf", fallback: "tree", scale: 1.9 },
    treeTall: { url: "assets/nature/tree_tall.glb", type: "gltf", fallback: "tree", scale: 1.8 },
    treeFat: { url: "assets/nature/tree_fat.glb", type: "gltf", fallback: "tree", scale: 1.6 },
    treeFall: { url: "assets/nature/tree_fall.glb", type: "gltf", fallback: "tree", scale: 1.7 },
    treeDetailed: { url: "assets/nature/tree_detailed.glb", type: "gltf", fallback: "tree", scale: 1.5 },
    treeOak: { url: "assets/nature/tree_oak.glb", type: "gltf", fallback: "tree", scale: 1.7 },
    treePine2: { url: "assets/nature/tree_pine2.glb", type: "gltf", fallback: "tree", scale: 1.8 },
    treeSimple: { url: "assets/nature/tree_simple.glb", type: "gltf", fallback: "tree", scale: 1.5 },
    rock: { url: "assets/nature/rock_large.glb", type: "gltf", fallback: "rock", scale: 1.4 },
    rockTall: { url: "assets/nature/rock_tall.glb", type: "gltf", fallback: "rock", scale: 1.3 },
    rockSmall: { url: "assets/nature/rock_small.glb", type: "gltf", fallback: "rock", scale: 1.2 },
    rockB: { url: "assets/nature/rock_large2.glb", type: "gltf", fallback: "rock", scale: 1.3 },
    cactus: { url: "assets/nature/cactus.glb", type: "gltf", fallback: "cactus", scale: 1.4 },
    tent: { url: "assets/nature/tent.glb", type: "gltf", fallback: "building", scale: 1.5 },
    tentSmall: { url: "assets/nature/tent_small.glb", type: "gltf", fallback: "building", scale: 1.3 },
    campfire: { url: "assets/nature/campfire.glb", type: "gltf", fallback: "crystal", scale: 1.4 },
    bush: { url: "assets/nature/bush.glb", type: "gltf", fallback: "mushroom", scale: 1.3 },
    bushSmall: { url: "assets/nature/bush_small.glb", type: "gltf", fallback: "mushroom", scale: 1.2 },
    flower: { url: "assets/nature/flower_red.glb", type: "gltf", fallback: "mushroom", scale: 1.4 },
    flowerY: { url: "assets/nature/flower_yellow.glb", type: "gltf", fallback: "mushroom", scale: 1.4 },
    log: { url: "assets/nature/log.glb", type: "gltf", fallback: "rock", scale: 1.3 },
    fence: { url: "assets/nature/fence.glb", type: "gltf", fallback: "rock", scale: 1.4 },
    sign: { url: "assets/nature/sign.glb", type: "gltf", fallback: "checkpoint", scale: 1.5 },
    crate: { url: "assets/nature/crate.glb", type: "gltf", fallback: "chest", scale: 1.3 },
    coin: { fallback: "coin", scale: 1 },
    portal: { fallback: "portal", scale: 1 },
    checkpoint: { url: "assets/nature/flag.glb", type: "gltf", fallback: "checkpoint", scale: 1.8 },
    crystal: { fallback: "crystal", scale: 1 },
    lamp: { fallback: "lamp", scale: 1 }
  },
  sounds: {
    bgm: "assets/music/cyber-theme.mp3",
    walk: "assets/sounds/walk.wav",
    jump: "assets/sounds/jump.wav",
    coin: "assets/sounds/coin.wav",
    treasure: "assets/sounds/treasure.wav",
    correct: "assets/sounds/correct.wav",
    wrong: "assets/sounds/wrong.wav",
    portal: "assets/sounds/portal.wav",
    complete: "assets/sounds/level-complete.wav",
    warning: "assets/sounds/timer-warning.wav",
    button: "assets/sounds/button.wav",
    interact: "assets/sounds/interact.wav"
  },
  ui: { logo: "assets/ui/logo.svg" }
};

export const ASSET_ROOT = "assets";
