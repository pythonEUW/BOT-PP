const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'test',
    description: 'Démarre un draft interactif pour créer deux équipes.',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu n'as pas la permission d'exécuter cette commande.");
        }

        const guild = message.guild;
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply("❌ Tu dois être dans un salon vocal pour lancer un draft.");
        }

        const members = voiceChannel.members.filter(member => !member.user.bot);
        /*if (members.size < 4) {
            return message.reply("❌ Il faut au moins 4 joueurs (2 par équipe) pour commencer un draft.");
        }*/

        //let availablePlayers = members.map(member => ({ label: member.user.username, value: member.id }));
        let availablePlayers = [
            { label: "Joueur1", value: "1" },
            { label: "Joueur2", value: "2" },
            { label: "Joueur3", value: "3" },
            { label: "Joueur4", value: "4" }
        ];
        
        let team1 = [];
        let team2 = [];

        // Sélection des capitaines
        const shuffled = [...members.values()].sort(() => Math.random() - 0.5);
        const captain1 = message.member;
        //const captain2 = availablePlayers[1];
        const captain2 = message.member;

        const draftEmbed = new EmbedBuilder()
            .setTitle("🏆 Draft League of Legends")
            .setDescription(`Les capitaines sont : **${captain1.user.displayName }** (Team 1) et **${captain2.user.displayName }** (Team 2)`)
            .setColor("#0099ff");

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('draft_select')
            .setPlaceholder('Choisissez un joueur')
            .addOptions(availablePlayers);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const draftMessage = await message.channel.send({ embeds: [draftEmbed], components: [row] });

        let currentCaptain = captain1;
        let turn = 1;

        const filter = (interaction) => interaction.customId === 'draft_select' && interaction.user.id === currentCaptain.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            const selectedId = interaction.values[0];
            const selectedPlayer = availablePlayers.find(player => player.value == selectedId);

            /*if (!selectedPlayer) {
                return interaction.reply({ content: "❌ Joueur introuvable.", ephemeral: true });
            }*/

            availablePlayers = availablePlayers.filter(player => player.value !== selectedId);
            selectMenu.setOptions(availablePlayers);
            row.setComponents(selectMenu);

            if (turn % 2 === 1) {
                team1.push(selectedPlayer.label);
                currentCaptain = captain2;
            } else {
                team2.push(selectedPlayer.label);
                currentCaptain = captain1;
            }

            turn++;

            const updatedEmbed = new EmbedBuilder()
                .setTitle("🏆 Draft League of Legends")
                .setDescription(`Les capitaines sont : **${captain1.user.displayName }**  (Team 1) et **${captain2.user.displayName }** (Team 2)`)
                .addFields(
                    { name: "Tour de :", value: currentCaptain.user.displayName , inline: false },
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
