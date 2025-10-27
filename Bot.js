const mineflayer = require('mineflayer');
const { ping } = require('minecraft-protocol');

// إعدادات السيرفر
const SERVER_HOST = '229.ip.ply.gg';
const SERVER_PORT = 21477;
const BOT_USERNAME = 'BotMC'; // غير هذا الاسم
const PASSWORD = 'fode123';

let bot = null;
let isRegistered = false;

// دالة لفحص ping والاعبين
async function checkServerStatus() {
    try {
        console.log('🔍 جاري فحص حالة السيرفر...');
        
        const status = await ping({
            host: SERVER_HOST,
            port: SERVER_PORT
        });
        
        console.log('✅ السيرفر متاح!');
        console.log(`📊 Ping: ${status.latency}ms`);
        console.log(`👥 اللاعبين: ${status.players.online}/${status.players.max}`);
        console.log(`📝 الإصدار: ${status.version.name}`);
        console.log('-------------------');
        
        return true;
    } catch (error) {
        console.log('❌ السيرفر غير متاح، سأحاول مرة أخرى...');
        return false;
    }
}

// دالة إنشاء البوت
function createBot() {
    bot = mineflayer.createBot({
        host: SERVER_HOST,
        port: SERVER_PORT,
        username: BOT_USERNAME,
        version: false, // يكتشف الإصدار تلقائياً
        hideErrors: false,
        checkTimeoutInterval: 60000,
        loadInternalPlugins: true
    });

    // عند الاتصال بالسيرفر
    bot.once('spawn', () => {
        console.log('✅ تم الدخول للسيرفر بنجاح!');
        console.log(`📍 الموقع: X=${bot.entity.position.x.toFixed(2)}, Y=${bot.entity.position.y.toFixed(2)}, Z=${bot.entity.position.z.toFixed(2)}`);
        console.log('⏳ جاري تحميل السيرفر ببطء...');
        
        // إذا كانت أول مرة، نسجل
        if (!isRegistered) {
            setTimeout(() => {
                console.log('📝 جاري التسجيل...');
                bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
                isRegistered = true;
            }, 2000);
        }
    });

    // استقبال الرسائل من السيرفر
    bot.on('message', (message) => {
        const msg = message.toString();
        console.log(`💬 السيرفر: ${msg}`);
        
        // التحقق من رسائل التسجيل الناجح
        if (msg.includes('registered') || msg.includes('سجلت') || msg.includes('success')) {
            console.log('✅ تم التسجيل بنجاح!');
        }
    });

    // عند الطرد من السيرفر
    bot.on('kicked', (reason) => {
        console.log('⚠️ تم طردي من السيرفر!');
        console.log(`السبب: ${reason}`);
        console.log('🔄 سأحاول الاتصال مرة أخرى بعد 3 ثواني...');
        setTimeout(attemptConnection, 3000);
    });

    // عند حدوث خطأ
    bot.on('error', (err) => {
        console.log('❌ حدث خطأ:', err.message);
    });

    // عند انقطاع الاتصال
    bot.on('end', (reason) => {
        console.log('⚠️ انقطع الاتصال:', reason);
        console.log('🔄 سأحاول الاتصال مرة أخرى بعد 3 ثواني...');
        setTimeout(attemptConnection, 3000);
    });

    // تحميل الـ chunks ببطء
    bot.on('chunkColumnLoad', (pos) => {
        console.log(`📦 تحميل Chunk: X=${pos.x}, Z=${pos.z}`);
    });

    // عند اكتمال التحميل
    let chunksLoaded = 0;
    bot.on('chunkColumnLoad', () => {
        chunksLoaded++;
        if (chunksLoaded % 10 === 0) {
            console.log(`📊 تم تحميل ${chunksLoaded} chunk...`);
        }
    });

    // معلومات الصحة والجوع
    bot.on('health', () => {
        console.log(`❤️ الصحة: ${bot.health.toFixed(1)}/20 | 🍖 الجوع: ${bot.food.toFixed(1)}/20`);
    });
}

// محاولة الاتصال بالسيرفر
async function attemptConnection() {
    const serverAvailable = await checkServerStatus();
    
    if (serverAvailable) {
        console.log('⏳ انتظار 3 ثواني قبل الدخول...');
        setTimeout(() => {
            console.log('🚀 جاري الاتصال بالسيرفر...');
            createBot();
        }, 3000);
    } else {
        console.log('⏳ سأحاول مرة أخرى بعد 3 ثواني...');
        setTimeout(attemptConnection, 3000);
    }
}

// بدء البوت
console.log('🤖 بوت ماين كرافت يستعد للعمل...');
console.log('📡 السيرفر: ' + SERVER_HOST);
console.log('-------------------');
attemptConnection();

// معالجة إيقاف البرنامج
process.on('SIGINT', () => {
    console.log('\n👋 جاري إيقاف البوت...');
    if (bot) {
        bot.quit();
    }
    process.exit();
});
