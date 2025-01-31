const axios = require('axios');

module.exports = {
    name: 'level',
    description: 'Obtenir le level d\'un joueur',
    async execute(message, args, RIOT_API_KEY) {
        if (args.length < 3) {
            return message.reply('Usage : `!level <pseudo> <tagLine>`');
        }

        const summonerName = args[0];
        const tagLine = args[1];

        try {
            const summonerRes = await axios.get(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`, {
                headers: { "X-Riot-Token": RIOT_API_KEY }
            });
            const summonerId = summonerRes.data.puuid;

            const levelRes = await axios.get(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${summonerId}`, {
                headers: { "X-Riot-Token": RIOT_API_KEY }
            });
            const level = levelRes.data.summonerLevel;

            let response = `🎮 **Level**: ${level}LP)\n`;

            message.reply(response);
            console.log(`🎮 **Level**: ${level}LP)\n`);
        } catch (error) {
            console.error(error);
            message.reply('❌ Erreur : Joueur non trouvé ou problème avec l\'API Riot.');
        }
    }
};
