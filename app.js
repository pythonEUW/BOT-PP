require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Charger les commandes
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

commandFiles.forEach(file => {
    const command = require(path.join(commandsPath, file));
    commands.set(command.name, command);
});

client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!')) {
        let args = message.content.split(' ');
        const commandName = args[0].slice(1).toLowerCase();

        const command = commands.get(commandName);

        if (command) {
            command.execute(message, args.slice(1), RIOT_API_KEY);
        }
        else {
            message.reply(`❌ Commande inconnue : ${commandName}`);
        }
    }
});

client.login(DISCORD_BOT_TOKEN);
