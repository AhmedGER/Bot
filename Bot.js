const mineflayer = require('mineflayer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const Movements = require('mineflayer-pathfinder').Movements;
const { GoalNear, GoalBlock } = require('mineflayer-pathfinder').goals;
const toolPlugin = require('mineflayer-tool').plugin;
const collectBlock = require('mineflayer-collectblock').plugin;
const pvp = require('mineflayer-pvp').plugin;
const armorManager = require('mineflayer-armor-manager');
const autoeat = require('mineflayer-auto-eat');
const Vec3 = require('vec3');

// Bot Configuration
const BOT_CONFIG = {
  host: 'localhost',
  port: 25565,
  username: 'SmartAI_Bot',
  version: '1.20.1'
};

// Gemini AI (FREE Forever!)
const genAI = new GoogleGenerativeAI('YOUR_API_KEY_HERE');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Advanced connection manager
let bot;
let isFullyLoaded = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5;

// Minecraft data
let mcData;

// Bot intelligence state
let chatHistory = [];
let currentTask = null;
let storageChest = null; // Chest for storing items

// Start connection process
async function startBot() {
  console.log('🔍 Checking server status...');
  
  try {
    // Ping server first
    const serverInfo = await pingServer(BOT_CONFIG.host, BOT_CONFIG.port);
    console.log(`✅ Server Online!`);
    console.log(`   Players: ${serverInfo.players.online}/${serverInfo.players.max}`);
    console.log(`   Version: ${serverInfo.version.name}`);
    console.log(`   Ping: ~${serverInfo.latency}ms`);
    
    if (serverInfo.description) {
      const motd = typeof serverInfo.description === 'string' 
        ? serverInfo.description 
        : JSON.stringify(serverInfo.description);
      console.log(`   MOTD: ${motd.substring(0, 50)}...`);
    }
    
    // Wait a bit before connecting
    console.log('⏳ Waiting 2 seconds before connecting...');
    await sleep(2000);
    
    // Now create bot
    createBot();
    
  } catch (error) {
    console.error('❌ Server ping failed:', error.message);
    console.log('⏳ Waiting 3 seconds before retry...');
    await sleep(3000);
    
    connectionAttempts++;
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`🔄 Retry attempt ${connectionAttempts}/${MAX_ATTEMPTS}`);
      startBot();
    } else {
      console.error('❌ Max connection attempts reached. Giving up.');
    }
  }
}

// Ping server utility
function pingServer(host, port) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const socket = net.createConnection({ host, port, timeout: 5000 });
    const startTime = Date.now();
    
    let buffer = Buffer.alloc(0);
    
    socket.on('connect', () => {
      // Send handshake + status request
      const handshake = Buffer.from([
        0x00, // Packet ID
        0x00, // Protocol version (varint)
        host.length, ...Buffer.from(host), // Server address
        port >> 8, port & 0xFF, // Port
        0x01 // Next state (status)
      ]);
      
      const statusRequest = Buffer.from([0x01, 0x00]);
      
      socket.write(Buffer.concat([
        Buffer.from([handshake.length]),
        handshake,
        statusRequest
      ]));
    });
    
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      try {
        // Parse response
        if (buffer.length > 5) {
          const jsonStart = buffer.indexOf('{');
          if (jsonStart !== -1) {
            const jsonStr = buffer.slice(jsonStart).toString();
            const serverData = JSON.parse(jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1));
            serverData.latency = Date.now() - startTime;
            socket.end();
            resolve(serverData);
          }
        }
      } catch (e) {
        // Keep waiting for more data
      }
    });
    
    socket.on('error', (err) => {
      reject(err);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

// Create bot with staged loading
function createBot() {
  console.log('🤖 Creating bot...');
  
  bot = mineflayer.createBot(BOT_CONFIG);
  
  // Load all plugins
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(toolPlugin);
  bot.loadPlugin(collectBlock);
  bot.loadPlugin(pvp);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(autoeat);
  
  setupBotEvents();
}

// Setup all bot event handlers
function setupBotEvents() {

// Load all plugins
bot.loadPlugin(pathfinder);
bot.loadPlugin(toolPlugin);
bot.loadPlugin(collectBlock);
bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(autoeat);

// Minecraft data
let mcData;

// Bot intelligence state
let chatHistory = [];
let currentTask = null;
let storageChest = null; // Chest for storing items

// When bot spawns
bot.once('spawn', async () => {
  console.log('✅ Bot spawned in world!');
  console.log('⏳ Loading resources gradually...');
  
  // Stage 1: Basic setup (immediate)
  mcData = require('minecraft-data')(bot.version);
  console.log('   ✓ Stage 1: Minecraft data loaded');
  
  await sleep(1000);
  
  // Stage 2: Auto-eat setup
  bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 14,
    bannedFood: []
  };
  console.log('   ✓ Stage 2: Auto-eat configured');
  
  await sleep(1000);
  
  // Stage 3: Pathfinding
  const defaultMove = new Movements(bot, mcData);
  defaultMove.canDig = true;
  defaultMove.allow1by1towers = false;
  bot.pathfinder.setMovements(defaultMove);
  console.log('   ✓ Stage 3: Pathfinding ready');
  
  await sleep(1000);
  
  // Stage 4: Armor manager
  bot.armorManager.equipAll();
  console.log('   ✓ Stage 4: Armor manager active');
  
  await sleep(2000);
  
  // Stage 5: Fully loaded - announce presence
  isFullyLoaded = true;
  console.log('✅ All resources loaded! Bot is fully operational.');
  
  bot.chat('Hello! I\'m a SMART AI bot.');
  await sleep(1000);
  bot.chat('I can loot chests, craft, smelt, and upgrade gear automatically!');
  await sleep(1000);
  bot.chat('Type !help for commands or just talk to me naturally!');
  
  console.log('🎮 Bot is ready for commands!');
});

// Handle login event
bot.once('login', () => {
  console.log('🔐 Logged in to server');
  console.log('⏳ Waiting for world data...');
});

// Connection error handling
bot.on('error', (err) => {
  console.error('❌ Bot Error:', err.message);
  
  if (!isFullyLoaded) {
    console.log('⏳ Error during connection, waiting 3 seconds...');
    setTimeout(() => {
      connectionAttempts++;
      if (connectionAttempts < MAX_ATTEMPTS) {
        console.log(`🔄 Reconnecting... (${connectionAttempts}/${MAX_ATTEMPTS})`);
        startBot();
      }
    }, 3000);
  }
});

bot.on('kicked', (reason) => {
  console.log('❌ Bot was kicked:', reason);
  console.log('⏳ Waiting 3 seconds before reconnect...');
  
  setTimeout(() => {
    connectionAttempts++;
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`🔄 Reconnecting... (${connectionAttempts}/${MAX_ATTEMPTS})`);
      startBot();
    }
  }, 3000);
});

bot.on('end', () => {
  console.log('❌ Disconnected from server');
  
  if (isFullyLoaded) {
    // Only reconnect if we were fully loaded before
    console.log('⏳ Waiting 3 seconds before reconnect...');
    setTimeout(() => {
      connectionAttempts = 0; // Reset attempts for clean reconnect
      isFullyLoaded = false;
      startBot();
    }, 3000);
  }
});

// Smart armor management - Auto upgrade
bot.on('playerCollect', async (collector, collected) => {
  if (collector !== bot.entity) return;
  
  // Auto equip better armor
  await sleep(200);
  bot.armorManager.equipAll();
  
  // Check if we collected better tools
  await smartToolUpgrade();
});

// Smart tool upgrade system
async function smartToolUpgrade() {
  const tools = ['pickaxe', 'axe', 'sword', 'shovel', 'hoe'];
  const materials = ['netherite', 'diamond', 'iron', 'stone', 'wooden', 'gold'];
  
  for (const tool of tools) {
    let bestMaterial = null;
    let bestItem = null;
    
    // Find best tool of this type
    for (const material of materials) {
      const itemName = `${material}_${tool}`;
      const item = bot.inventory.items().find(i => i.name === itemName);
      
      if (item) {
        bestMaterial = material;
        bestItem = item;
        break; // Found best material
      }
    }
    
    // If we have a better tool, announce it
    if (bestItem && bestMaterial !== 'wooden') {
      console.log(`✓ Best ${tool}: ${bestMaterial}`);
    }
  }
}

// Listen to chat (only when fully loaded)
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  // Ignore commands until fully loaded
  if (!isFullyLoaded) {
    console.log(`⏳ Ignoring command from ${username} - bot still loading...`);
    return;
  }
  
  console.log(`${username}: ${message}`);
  
  if (message.startsWith('!') || message.toLowerCase().includes('bot') || message.includes('?')) {
    await handleAICommand(username, message);
  }
});

// Main AI command handler
async function handleAICommand(username, message) {
  const msg = message.toLowerCase().replace('!', '').trim();
  
  try {
    // Quick commands
    if (msg === 'help') {
      bot.chat('🤖 Smart Commands: !loot, !craft [item], !smelt [ore], !upgrade, !find [resource], !build, !stats');
      return;
    }
    
    if (msg === 'stats' || msg === 'status') {
      showStats();
      return;
    }
    
    if (msg === 'inventory' || msg === 'inv') {
      showInventory();
      return;
    }
    
    if (msg.includes('loot')) {
      await lootNearbyChests();
      return;
    }
    
    if (msg.includes('upgrade')) {
      await autoUpgradeGear();
      return;
    }
    
    // AI-powered response
    bot.chat('🤔 Thinking...');
    const aiResponse = await getSmartAIResponse(username, msg);
    
    // Send response
    const messages = splitMessage(aiResponse);
    for (const m of messages) {
      bot.chat(m);
      await sleep(500);
    }
    
    // Execute intelligent actions
    await executeSmartActions(aiResponse, username, msg);
    
  } catch (error) {
    console.error('Error:', error);
    bot.chat('Oops! Something went wrong.');
  }
}

// Advanced AI with full context
async function getSmartAIResponse(username, userMessage) {
  // Analyze surroundings
  const nearbyChests = bot.findBlocks({
    matching: (block) => block.name.includes('chest'),
    maxDistance: 32,
    count: 10
  });
  
  const nearbyVillages = bot.findBlocks({
    matching: (block) => block.name.includes('bed') || block.name.includes('bell'),
    maxDistance: 64,
    count: 5
  });
  
  const craftingTable = bot.findBlock({
    matching: mcData.blocksByName.crafting_table?.id,
    maxDistance: 32
  });
  
  const furnace = bot.findBlock({
    matching: (block) => block.name.includes('furnace'),
    maxDistance: 32
  });
  
  // Tool quality assessment
  const tools = analyzeTools();
  const armor = analyzeArmor();
  
  const inventory = bot.inventory.items()
    .map(i => `${i.name}(${i.count})`)
    .slice(0, 20)
    .join(', ');
  
  const systemPrompt = `You are an extremely SMART Minecraft survival bot with advanced capabilities.

🎯 YOUR ABILITIES:
1. **Loot Management**: Open and loot chests automatically
2. **Smart Crafting**: Craft any item if you have materials
3. **Auto Smelting**: Use furnaces to smelt ores
4. **Gear Upgrades**: Automatically equip better armor/tools
5. **Resource Finding**: Locate and mine specific resources
6. **Village Raiding**: Find and loot village chests
7. **Tool Intelligence**: Always use the best tool available
8. **Strategic Planning**: Make smart survival decisions

📊 CURRENT STATUS:
- Health: ${bot.health}/20 | Food: ${bot.food}/20 | XP: ${bot.experience.level}
- Tools: ${tools}
- Armor: ${armor}
- Inventory: ${inventory || 'empty'}
- Nearby: ${nearbyChests.length} chests, ${nearbyVillages.length > 0 ? 'Village nearby!' : 'no villages'}
- Crafting Table: ${craftingTable ? 'Available' : 'None'}
- Furnace: ${furnace ? 'Available' : 'None'}

🧠 INTELLIGENCE RULES:
1. **Be proactive**: Suggest smart actions based on situation
2. **Prioritize survival**: Health and food come first
3. **Upgrade mentality**: Always seek better gear
4. **Resource awareness**: Know what materials you need
5. **Short responses**: Max 25 words for chat
6. **Action clarity**: State clearly what you'll do

EXAMPLES:
- "I found iron!" → "Great! I'll craft iron tools to replace my stone ones"
- "Go loot that village" → "On it! I'll check all chests and grab valuables"
- "We need diamonds" → "I'll mine at Y=11 and bring back what I find"

Player ${username}: ${userMessage}`;

  const chat = model.startChat({
    history: chatHistory.slice(-6),
    generationConfig: {
      maxOutputTokens: 120,
      temperature: 0.85,
    },
  });

  const result = await chat.sendMessage(systemPrompt);
  const aiMessage = result.response.text();
  
  chatHistory.push(
    { role: 'user', parts: [{ text: `${username}: ${userMessage}` }] },
    { role: 'model', parts: [{ text: aiMessage }] }
  );
  
  return aiMessage;
}

// Analyze current tools
function analyzeTools() {
  const tools = ['sword', 'pickaxe', 'axe', 'shovel'];
  const materials = ['netherite', 'diamond', 'iron', 'stone', 'wooden'];
  
  let result = [];
  for (const tool of tools) {
    for (const mat of materials) {
      if (bot.inventory.items().find(i => i.name === `${mat}_${tool}`)) {
        result.push(`${mat} ${tool}`);
        break;
      }
    }
  }
  return result.join(', ') || 'no tools';
}

// Analyze current armor
function analyzeArmor() {
  const slots = ['head', 'torso', 'legs', 'feet'];
  let armor = [];
  
  for (const slot of slots) {
    const item = bot.inventory.slots[bot.getEquipmentDestSlot(slot)];
    if (item) {
      const material = item.name.split('_')[0];
      armor.push(material);
    }
  }
  
  return armor.length > 0 ? armor.join('/') : 'no armor';
}

// Execute smart actions based on AI response
async function executeSmartActions(response, username, originalMsg) {
  const res = response.toLowerCase();
  const msg = originalMsg.toLowerCase();
  
  // Loot chests
  if (res.includes('loot') || res.includes('chest') || msg.includes('loot')) {
    await lootNearbyChests();
  }
  
  // Craft items
  if (res.includes('craft') || msg.includes('craft')) {
    const itemName = extractItemName(msg, 'craft');
    if (itemName) await smartCraft(itemName);
  }
  
  // Smelt ores
  if (res.includes('smelt') || msg.includes('smelt')) {
    const oreName = extractItemName(msg, 'smelt');
    if (oreName) await smartSmelt(oreName);
  }
  
  // Find and mine resources
  if (res.includes('mine') || res.includes('find') || msg.includes('find') || msg.includes('get')) {
    const resource = extractItemName(msg, 'mine');
    if (resource) await findAndCollect(resource);
  }
  
  // Auto upgrade gear
  if (res.includes('upgrade') || msg.includes('upgrade')) {
    await autoUpgradeGear();
  }
  
  // Movement commands
  if (res.includes('come') || msg.includes('come')) {
    const player = bot.players[username];
    if (player?.entity) {
      await bot.pathfinder.goto(new GoalNear(
        player.entity.position.x,
        player.entity.position.y,
        player.entity.position.z, 2
      ));
    }
  }
}

// Smart chest looting
async function lootNearbyChests() {
  try {
    const chests = bot.findBlocks({
      matching: (block) => block.name.includes('chest') && !block.name.includes('ender'),
      maxDistance: 32,
      count: 10
    });
    
    if (chests.length === 0) {
      bot.chat('No chests nearby to loot!');
      return;
    }
    
    bot.chat(`Found ${chests.length} chest(s)! Looting...`);
    let lootedCount = 0;
    
    for (const chestPos of chests) {
      try {
        const chestBlock = bot.blockAt(chestPos);
        if (!chestBlock) continue;
        
        // Go to chest
        await bot.pathfinder.goto(new GoalBlock(chestPos.x, chestPos.y, chestPos.z));
        
        // Open chest
        const chest = await bot.openContainer(chestBlock);
        
        // Take valuable items
        const valuableItems = chest.containerItems().filter(item => 
          item && (
            item.name.includes('diamond') ||
            item.name.includes('iron') ||
            item.name.includes('gold') ||
            item.name.includes('emerald') ||
            item.name.includes('sword') ||
            item.name.includes('armor') ||
            item.name.includes('pickaxe') ||
            item.name.includes('food') ||
            item.name.includes('bread') ||
            item.name === 'stick' ||
            item.name === 'coal'
          )
        );
        
        for (const item of valuableItems) {
          try {
            await chest.withdraw(item.type, null, item.count);
            await sleep(100);
          } catch (e) {}
        }
        
        chest.close();
        lootedCount++;
        await sleep(300);
        
        // Auto-equip better armor
        bot.armorManager.equipAll();
        
      } catch (e) {
        console.log(`Chest error: ${e.message}`);
      }
    }
    
    bot.chat(`✓ Looted ${lootedCount} chests!`);
    await smartToolUpgrade();
    
  } catch (error) {
    console.error('Loot error:', error.message);
    bot.chat('Failed to loot chests');
  }
}

// Smart crafting system
async function smartCraft(itemName) {
  try {
    bot.chat(`Attempting to craft ${itemName}...`);
    
    // Find crafting table
    const craftingTable = bot.findBlock({
      matching: mcData.blocksByName.crafting_table?.id,
      maxDistance: 32
    });
    
    // Get recipes
    const item = mcData.itemsByName[itemName];
    if (!item) {
      bot.chat(`Don't know how to craft ${itemName}`);
      return;
    }
    
    const recipes = bot.recipesFor(item.id, null, 1, craftingTable);
    
    if (recipes.length === 0) {
      bot.chat(`Can't craft ${itemName} - missing materials or table`);
      return;
    }
    
    // Go to crafting table if needed
    if (craftingTable && !recipes[0].requiresTable) {
      // Can craft in inventory
      await bot.craft(recipes[0], 1, null);
    } else if (craftingTable) {
      await bot.pathfinder.goto(new GoalBlock(
        craftingTable.position.x,
        craftingTable.position.y,
        craftingTable.position.z
      ));
      await bot.craft(recipes[0], 1, craftingTable);
    }
    
    bot.chat(`✓ Crafted ${itemName}!`);
    
  } catch (error) {
    console.error('Craft error:', error.message);
    bot.chat(`Failed to craft: ${error.message}`);
  }
}

// Smart smelting system
async function smartSmelt(oreName) {
  try {
    bot.chat(`Looking for furnace to smelt ${oreName}...`);
    
    const furnaceBlock = bot.findBlock({
      matching: (block) => block.name === 'furnace' || block.name === 'blast_furnace',
      maxDistance: 32
    });
    
    if (!furnaceBlock) {
      bot.chat('No furnace nearby! Should I craft one?');
      return;
    }
    
    // Go to furnace
    await bot.pathfinder.goto(new GoalBlock(
      furnaceBlock.position.x,
      furnaceBlock.position.y,
      furnaceBlock.position.z
    ));
    
    // Open furnace
    const furnace = await bot.openFurnace(furnaceBlock);
    
    // Find ore and fuel
    const ore = bot.inventory.items().find(i => i.name.includes(oreName));
    const fuel = bot.inventory.items().find(i => 
      i.name === 'coal' || i.name === 'charcoal' || i.name.includes('log')
    );
    
    if (!ore) {
      bot.chat(`I don't have any ${oreName}!`);
      furnace.close();
      return;
    }
    
    if (!fuel) {
      bot.chat('No fuel! Need coal or wood');
      furnace.close();
      return;
    }
    
    // Put ore and fuel
    await furnace.putInput(ore.type, null, ore.count);
    await furnace.putFuel(fuel.type, null, Math.min(fuel.count, 8));
    
    bot.chat(`⚒️ Smelting ${ore.count} ${oreName}... (will take ~${ore.count * 10}s)`);
    
    // Wait for smelting
    await sleep(ore.count * 10000 + 2000);
    
    // Take output
    if (furnace.outputItem()) {
      await furnace.takeOutput();
      bot.chat('✓ Smelting complete!');
    }
    
    furnace.close();
    
  } catch (error) {
    console.error('Smelt error:', error.message);
    bot.chat('Failed to smelt');
  }
}

// Find and collect resources
async function findAndCollect(resourceName) {
  try {
    bot.chat(`Searching for ${resourceName}...`);
    
    const blockType = mcData.blocksByName[resourceName];
    if (!blockType) {
      bot.chat(`Don't know what ${resourceName} is`);
      return;
    }
    
    const block = bot.findBlock({
      matching: blockType.id,
      maxDistance: 64
    });
    
    if (!block) {
      bot.chat(`Can't find ${resourceName} nearby`);
      return;
    }
    
    bot.chat(`Found ${resourceName}! Mining...`);
    
    // Use collect block plugin for smart collection
    await bot.collectBlock.collect(block);
    
    bot.chat(`✓ Collected ${resourceName}!`);
    
  } catch (error) {
    console.error('Collect error:', error.message);
    bot.chat('Failed to collect');
  }
}

// Auto upgrade gear
async function autoUpgradeGear() {
  try {
    bot.chat('Analyzing gear for upgrades...');
    
    const materials = {
      netherite: 5,
      diamond: 4,
      iron: 3,
      stone: 2,
      wooden: 1,
      leather: 1
    };
    
    // Check what materials we have
    let bestMaterial = null;
    let bestScore = 0;
    
    for (const [mat, score] of Object.entries(materials)) {
      const hasIngot = bot.inventory.items().find(i => 
        i.name === `${mat}_ingot` || i.name.includes(mat)
      );
      if (hasIngot && score > bestScore) {
        bestMaterial = mat;
        bestScore = score;
      }
    }
    
    if (!bestMaterial) {
      bot.chat('No materials to upgrade gear');
      return;
    }
    
    bot.chat(`I have ${bestMaterial}! Crafting better tools...`);
    
    // Craft tools in priority order
    const tools = ['sword', 'pickaxe', 'axe', 'shovel'];
    
    for (const tool of tools) {
      await smartCraft(`${bestMaterial}_${tool}`);
      await sleep(500);
    }
    
    bot.chat('✓ Gear upgraded!');
    
  } catch (error) {
    console.error('Upgrade error:', error.message);
  }
}

// Show stats
function showStats() {
  const tools = analyzeTools();
  const armor = analyzeArmor();
  bot.chat(`💚 HP:${bot.health} 🍖 Food:${bot.food} ⭐ Lvl:${bot.experience.level}`);
  bot.chat(`🛠️ ${tools} | 🛡️ ${armor}`);
}

// Show inventory
function showInventory() {
  const items = bot.inventory.items()
    .map(i => `${i.name}×${i.count}`)
    .slice(0, 10)
    .join(', ');
  bot.chat(items || 'Empty inventory');
}

// Extract item name from message
function extractItemName(msg, context) {
  const words = msg.split(' ');
  
  if (context === 'craft') {
    const items = ['sword', 'pickaxe', 'axe', 'shovel', 'furnace', 'chest', 'stick', 'torch'];
    return words.find(w => items.some(i => w.includes(i)));
  }
  
  if (context === 'smelt') {
    const ores = ['iron', 'gold', 'copper', 'raw'];
    return words.find(w => ores.some(o => w.includes(o)));
  }
  
  if (context === 'mine') {
    const resources = ['diamond', 'iron', 'coal', 'wood', 'stone', 'gold', 'copper'];
    return words.find(w => resources.some(r => w.includes(r)));
  }
  
  return null;
}

// Utility functions
function splitMessage(message, maxLength = 250) {
  if (message.length <= maxLength) return [message];
  const messages = [];
  let current = '';
  for (const word of message.split(' ')) {
    if ((current + ' ' + word).length > maxLength) {
      messages.push(current.trim());
      current = word;
    } else {
      current += (current ? ' ' : '') + word;
    }
  }
  if (current) messages.push(current.trim());
  return messages;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error handling - REMOVED (now in setupBotEvents)

console.log('🧠 Starting SUPER SMART AI Bot...');

// Start the bot with advanced connection system
startBot();
