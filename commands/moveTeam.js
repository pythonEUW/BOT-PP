const { GatewayIntentBits, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'moveteam',
    description: 'Déplace tous les membres avec les rôles "team 1" et "team 2" vers leurs salons vocaux respectifs.',
    async execute(message, args) {
        const teams = [
            { roleName: 'team 1', voiceChannelName: 'TEAM 1' },
            { roleName: 'team 2', voiceChannelName: 'TEAM 2' }
        ];

        if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return message.reply("❌ Tu n'as pas la permission de déplacer des membres !");
        }

        const guild = message.guild;
        if (!guild) return message.reply("❌ Impossible de trouver le serveur.");

        let movedPlayers = 0;

        for (const team of teams) {
            const role = guild.roles.cache.find(r => r.name === team.roleName);
            if (!role) {
                message.reply(`❌ Rôle "${team.roleName}" introuvable.`);
                continue;
            }

            const voiceChannel = guild.channels.cache.find(ch => ch.name === team.voiceChannelName && ch.type === 2);
            if (!voiceChannel) {
                message.reply(`❌ Salon vocal "${team.voiceChannelName}" introuvable.`);
                continue;
            }

            const membersToMove = guild.members.cache.filter(member =>
                member.roles.cache.has(role.id) && member.voice.channel
            );

            if (membersToMove.size === 0) {
                message.reply(`ℹ️ Aucun membre du rôle "${team.roleName}" n'est connecté en vocal.`);
                continue;
            }

            membersToMove.forEach(member => {
                member.voice.setChannel(voiceChannel)
                    .then(() => {
                        console.log(`➡️ ${member.user.tag} déplacé vers "${team.voiceChannelName}"`);
                        movedPlayers++;
                    })
                    .catch(err => console.error(`❌ Impossible de déplacer ${member.user.tag}:`, err));
            });
        }

        if (movedPlayers > 0) {
            message.reply(`✅ Tous les membres ont été déplacés vers leurs salons respectifs !`);
        } else {
            message.reply(`ℹ️ Aucun membre n'a été déplacé.`);
        }
    }
};
