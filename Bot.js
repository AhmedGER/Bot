import mineflayer from 'mineflayer';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';
import collect from 'mineflayer-collectblock';
import pvp from 'mineflayer-pvp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Vec3 from 'vec3';

const GEMINI_KEY = 'AIzaSyCMRCQ_HJ_s-KV0XgdkSoLbanHtw3J9NE4';
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const PASSWORD = 'fode123';               // كلمة السر التي ستسجل بها
const SERVER_TYPE = 'offline';            // 'offline' أو 'premium'

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'GeminiBot',
  version: '1.21.4',
  auth: SERVER_TYPE                     // microsoft / mojang / offline
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(collect);
bot.loadPlugin(pvp);

/* ============== 1. Registration Layer ============== */
let registered = false;
bot.once('spawn', async () => {
  console.log('[Bot] Spawned – waiting 2 s then register...');
  await sleep(2000);
  bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
  console.log('[Bot] Sent /register command');
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  // AuthMe success patterns
  if (/registered|logged in|already logged/i.test(message)) {
    registered = true;
    console.log('[Bot] Registration complete – now listening to orders');
    bot.chat('Hello! I am ready – talk to me.');
  }
  // if server says “already registered” try login
  if (/already registered|use \/login/i.test(message)) {
    bot.chat(`/login ${PASSWORD}`);
    console.log('[Bot] Sent /login command');
  }
  // only AFTER login → process player orders
  if (registered) handleOrder(username, message);
});

/* ============== 2. Gemini Order Handler ============== */
async function handleOrder(username, msg) {
  const prompt = `
You are an expert Minecraft AI that can do absolutely everything in the game.
Player ${username} says: "${msg}"
Reply with a short sentence, then add a newline starting with ACTION: and a single command.
Available commands (you can use ANY):
goToPlayer(name), followPlayer(name), attack(name), collectNearest(block), build(structure), mineDiamonds(n), stripMine(direction,blocks), digDown(n), digForward(n), placeBlock(block), equip(tool), eat, sleep, wake, look(x,y,z), craft(item,amount), drop(item,amount), fish, milk, shear, trade(name,item), replant(crop), farmCrop(crop), killMobs(radius), smelt(item,amount), brew(potion), enchant(item,ench), repair(item), organizeInventory, dumpTrash, eChestStore, eChestTake, goNether(), goOverworld(), goEnd(), pearl(x,y,z), anchor(x,y,z,charges), boat(), elytra(), flyTo(x,y,z), land(), firework(), ride(entity), strider(), feed(entity), tame(entity), leash(entity), unleash(entity), sit(), stand(), openDoor(), closeDoor(), lever(state), button(), dispenserFill(items), dropperClock(period), observerLine(), pistonPush(), slimeFly(), tntDupe(), witherBuild(), dragonFight(), guardianFarm(), ironFarm(), goldFarm(), raidFarm(), slimeFarm(), witchFarm(), villagerZombieCure(), piglinBarter(), enderPearlStasis(), bedExplode(), anchorExplode(), crystalPvp(), bowBoost(), snowKnock(), fishingRodPull(), autoFarm(), autoFish(), autoMine(), autoBuild(), autoCraft(), autoSmelt(), autoBrew(), autoEnchant(), autoRepair(), autoTrade(), autoBarter(), organizeChest(), sortInventory(), dumpJunk(), eSort(), antiAFK(), rainbowBeacon(), mapArt(), signWriter(), bookWriter(), noteBlockSong(), jukeboxPlay(), fireworkShow(), bannerCreator(), loomPattern(), carpetDupe(), railDupe(), gravityDupe(), zeroTickFarm(), raidFarm(), endGateway(), portalLink(), strongLocate(), mansionLocate(), monumentLocate(), outpostLocate(), cityLocate(), fortressLocate(), bastionLocate(), endCityLocate(), ancientLocate(), shipwreckLocate(), buriedLocate(), ruinLocate(), trailLocate(), villageLocate(), mineshaftLocate(), dungeonLocate(), spawnerLocate(), slimeChunk(), biomeLocate(), temperatureCheck(), weatherCheck(), moonPhase(), lightLevelCheck(), spawnProof(), hostileSpawn(), passiveSpawn(), ironGolemSpawn(), snowGolemSpawn(), witherSpawn(), enderDragonSpawn(), raidSpawn(), catSpawn(), dogSpawn(), foxSpawn(), pandaSpawn(), parrotSpawn(), dolphinSpawn(), turtleSpawn(), fishSpawn(), squidSpawn(), glowSquidSpawn(), axolotlSpawn(), frogSpawn(), tadpoleSpawn(), allaySpawn(), wardenSpawn(), camelSpawn(), snifferSpawn(), traderSpawn(), wanderingSpawn(), pillagerSpawn(), evokerSpawn(), vindicatorSpawn(), illusionerSpawn(), vexSpawn(), ravagerSpawn(), witchSpawn(), guardianSpawn(), elderGuardianSpawn(), blazeSpawn(), magmaCubeSpawn(), piglinSpawn(), piglinBruteSpawn(), zombifiedPiglinSpawn(), hoglinSpawn(), zoglinSpawn(), striderSpawn(), endermanSpawn(), endermiteSpawn(), shulkerSpawn(), ghastSpawn(), slimeSpawn(), silverfishSpawn(), caveSpiderSpawn(), spiderSpawn(), skeletonSpawn(), straySpawn(), witherSkeletonSpawn(), zombieSpawn(), huskSpawn(), drownedSpawn(), zombieVillagerSpawn(), creeperSpawn(), phantomSpawn(), beeSpawn(), enderCrystalSpawn(), armorStandSpawn(), itemFrameSpawn(), paintingSpawn(), leashKnotSpawn(), boatSpawn(), minecartSpawn(), tntSpawn(), fallingBlockSpawn(), fireballSpawn(), dragonFireballSpawn(), witherSkullSpawn(), shulkerBulletSpawn(), llamaSpitSpawn(), experienceOrbSpawn(), eyeOfEnderSpawn(), fireworkSpawn(), fishingFloatSpawn(), potionSpawn(), experienceBottleSpawn(), arrowSpawn(), spectralArrowSpawn(), tippedArrowSpawn(), snowballSpawn(), eggSpawn(), enderPearlSpawn(), bottleEnchantingSpawn(), thrownTridentSpawn(), fireworkRocketSpawn(), leashKnotSpawn(), lightningBoltSpawn(), weatherSpawn(), endGatewaySpawn(), portalSpawn(), dragonRespawn(), raidWaveSpawn(), patrolSpawn(), catMorningGiftSpawn(), foxSweetBerrySpawn(), turtleEggHatchSpawn(), frogEatSlimeSpawn(), snifferDigSpawn(), camelDashSpawn(), allayItemThrowSpawn(), wardenEmergenceSpawn(), wardenDigSpawn(), wardenRoarSpawn()
`.trim();

  const reply = await model.generateContent(prompt);
  const [text, actionLine] = reply.split('ACTION:');
  bot.chat(text.replace(/\n/g, ' '));
  if (actionLine) await execute(actionLine.trim());
}

/* ============== 3. Tiny Executor (expandable) ============== */
async function execute(cmd) {
  const a = cmd.split(/[(),]/).map(s => s.trim());
  switch (a[0]) {
    case 'goToPlayer':
      return bot.pathfinder.setGoal(new goals.GoalFollow(bot.players[a[1]].entity, 1));
    case 'mineDiamonds':
      return mineDiamonds(Number(a[1] || 10));
    case 'autoFarm':
      return autoFarm();
    case 'autoFish':
      return autoFish();
    case 'autoMine':
      return stripMine('x', Number(a[1] || 200));
    case 'build':
      return buildSchem(a[1]);   // schematic file name
    case 'stop':
      return bot.pathfinder.stop();
    default:
      bot.chat('I know that command but the dev hasn\'t wired it yet.');
  }
}

/* ============== 4. Example Skills ============== */
async function mineDiamonds(amount) {
  const collect = bot.collectBlock;
  let mined = 0;
  while (mined < amount) {
    const target = bot.findBlock({
      matching: ['diamond_ore', 'deepslate_diamond_ore'],
      maxDistance: 64, count: 1
    });
    if (!target) { bot.chat('No diamond ore visible.'); break; }
    await collect.collect(target);
    mined++;
  }
  bot.chat(`Done, collected ${mined} diamonds.`);
}

async function stripMine(dir, blocks) {
  const vec = { x: 0, y: 0, z: 0 };
  vec[dir] = 1;
  for (let i = 0; i < blocks; i++) {
    await bot.pathfinder.goto(new goals.GoalBlock(
      Math.floor(bot.entity.position.x) + vec.x * i,
      Math.floor(bot.entity.position.y),
      Math.floor(bot.entity.position.z) + vec.z * i
    ));
    await digForward(1);
  }
}

async function digForward(n) {
  for (let i = 0; i < n; i++) {
    const target = bot.blockAt(bot.entity.position.offset(1, 0, 0));
    if (target && target.name !== 'air') await bot.dig(target);
    await bot.waitForTicks(5);
  }
}

async function autoFish() {
  bot.activateItem();
  bot.on('playerCollect', (collector) => {
    if (collector === bot.entity) bot.chat('Fish caught!');
  });
}

async function buildSchem(name) {
  bot.chat(`Building ${name} - not implemented yet`);
  // wire mineflayer-schematic or prismarine-schematic here
}

/* ============== 5. Utils ============== */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ============== 6. Safety ============== */
bot.on('death', () => bot.chat('I died, respawning...'));
bot.on('error', err => console.log('Bot error:', err));
