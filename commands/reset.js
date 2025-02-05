const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'reset',
    description: 'Reset les rôles team 1 et team 2.',
    async execute(message, args) {
        // Vérifier si l'utilisateur a l'autorisation d'utiliser la commande
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission d'exécuter cette commande.");
        }

        // Récupérer les rôles par leur nom
        let roleTeam1 = message.guild.roles.cache.find(role => role.name === "team 1");
        let roleTeam2 = message.guild.roles.cache.find(role => role.name === "team 2");

        // Vérifier si les rôles existent
        if (!roleTeam1 || !roleTeam2) {
            return message.reply("❌ Les rôles 'team 1' ou 'team 2' n'existent pas !");
        }

        // Récupérer tous les membres du serveur
        const members = await message.guild.members.fetch();

        console.log(`Nombre total de membres : ${members.size}`);

        // Parcourir chaque membre et supprimer les rôles
        members.forEach(async member => {
            if (member.roles.cache.has(roleTeam1.id)) {
                console.log(`Suppression de ${roleTeam1.name} pour ${member.user.tag}`);
                await member.roles.remove(roleTeam1.id).catch(err => console.error(`Erreur suppression team 1 :`, err));
            }
            if (member.roles.cache.has(roleTeam2.id)) {
                console.log(`Suppression de ${roleTeam2.name} pour ${member.user.tag}`);
                await member.roles.remove(roleTeam2.id).catch(err => console.error(`Erreur suppression team 2 :`, err));
            }
        });

        // Confirmer l'action
        message.reply("✅ Tous les rôles 'team 1' et 'team 2' ont été supprimés.");
    }
};
