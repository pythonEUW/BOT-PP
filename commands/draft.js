const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'draft',
    description: 'Démarre un draft interactif pour créer deux équipes avec deux capitaines spécifiés.',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission d'exécuter cette commande.");
        }

        if (message.mentions.members.size !== 2) {
            return message.reply("❌ Tu dois mentionner **deux** joueurs pour qu'ils soient capitaines. Exemple : `!draft @Captain1 @Captain2`");
        }

        const [captain1, captain2] = message.mentions.members.map(member => member);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply("❌ Tu dois être dans un salon vocal pour lancer un draft.");
        }

        const members = voiceChannel.members.filter(member => !member.user.bot && member.id !== captain1.id && member.id !== captain2.id);

        if (members.size < 2) {
            return message.reply("❌ Il faut au moins **2 joueurs** (hors capitaines) pour commencer un draft.");
        }

        // Création des rôles si nécessaires
        let roleTeam1 = message.guild.roles.cache.find(role => role.name === "team 1");
        let roleTeam2 = message.guild.roles.cache.find(role => role.name === "team 2");

        if (!roleTeam1) {
            roleTeam1 = await message.guild.roles.create({
                name: "team 1",
                color: "BLUE",
                reason: "Création du rôle pour le draft"
            });
        }

        if (!roleTeam2) {
            roleTeam2 = await message.guild.roles.create({
                name: "team 2",
                color: "RED",
                reason: "Création du rôle pour le draft"
            });
        }

        let availablePlayers = members.map(member => ({ label: member.user.displayName, value: member.id }));
        let team1 = [];
        let team2 = [];

        // Détermination du capitaine qui commence aléatoirement
        const firstCaptain = Math.random() < 0.5 ? captain1 : captain2;
        const secondCaptain = firstCaptain.id === captain1.id ? captain2 : captain1;

        const captainMap = {
            1: firstCaptain,
            2: secondCaptain
        };

        // Séquence de picks : 1, 2, 2, 1, 1, 2, ...
        const pickPattern = [1, 2, 2, 1, 1];
        const pickSequence = [];
        while (pickSequence.length < members.size) {
            pickSequence.push(...pickPattern);
        }
        pickSequence.length = members.size; // Trim à la bonne taille

        let pickIndex = 0;

        // Ajout des rôles aux capitaines
        await captain1.roles.add(roleTeam1);
        await captain2.roles.add(roleTeam2);

        const draftEmbed = new EmbedBuilder()
            .setTitle("🏆 Draft League of Legends")
            .setDescription(`Les capitaines sont : **${captain1.displayName}** (Team 1) et **${captain2.displayName}** (Team 2)\nPremier à choisir : **${firstCaptain.displayName}**`)
            .setColor("#0099ff");

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('draft_select')
            .setPlaceholder('Choisissez un joueur')
            .addOptions(availablePlayers);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const draftMessage = await message.channel.send({ embeds: [draftEmbed], components: [row] });

        const collector = message.channel.createMessageComponentCollector({ time: 60000 * 5 });

        collector.on('collect', async (interaction) => {
            const currentCaptainNum = pickSequence[pickIndex];
            const currentCaptain = captainMap[currentCaptainNum];

            if (interaction.customId !== 'draft_select' || interaction.user.id !== currentCaptain.id) {
                return interaction.reply({ content: "⛔ Ce n’est pas ton tour de choisir !", ephemeral: true });
            }

            const selectedId = interaction.values[0];
            const selectedPlayer = availablePlayers.find(player => player.value === selectedId);
            const selectedMember = message.guild.members.cache.get(selectedId);

            availablePlayers = availablePlayers.filter(player => player.value !== selectedId);
            selectMenu.setOptions(availablePlayers);
            row.setComponents(selectMenu);

            if (currentCaptain.id === captain1.id) {
                team1.push(selectedPlayer.label);
                await selectedMember.roles.add(roleTeam1);
            } else {
                team2.push(selectedPlayer.label);
                await selectedMember.roles.add(roleTeam2);
            }

            pickIndex++;

            const nextCaptainNum = pickSequence[pickIndex];
            const nextCaptain = nextCaptainNum ? captainMap[nextCaptainNum].displayName : "Aucun (draft terminé)";

            const updatedEmbed = new EmbedBuilder()
                .setTitle("🏆 Draft League of Legends")
                .setDescription(`Les capitaines sont : **${captain1.displayName}** (Team 1) et **${captain2.displayName}** (Team 2)`)
                .addFields(
                    { name: "Tour de :", value: nextCaptain, inline: false },
                    { name: "Team 1 🟦", value: team1.length ? team1.join("\n") : "Aucun joueur", inline: true },
                    { name: "Team 2 🟥", value: team2.length ? team2.join("\n") : "Aucun joueur", inline: true }
                )
                .setColor("#0099ff");

            await interaction.update({ embeds: [updatedEmbed], components: availablePlayers.length ? [row] : [] });

            if (availablePlayers.length === 0) {
                collector.stop();
            }
        });

        collector.on('end', () => {
            const finalEmbed = new EmbedBuilder()
                .setTitle("🏆 Draft terminé !")
                .setDescription("Les équipes sont complètes !")
                .addFields(
                    { name: "Team 1 🟦", value: team1.join("\n"), inline: true },
                    { name: "Team 2 🟥", value: team2.join("\n"), inline: true }
                )
                .setColor("#00ff00");

            draftMessage.edit({ embeds: [finalEmbed], components: [] });
        });
    }
};
