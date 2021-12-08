const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('tidal')
    .setDescription('Live Code!')
    .addStringOption(option =>
      option.setName('input').setDescription('Enter a tidalcycles command')
    ),
  new SlashCommandBuilder()
    .setName('tidal-tutorial')
    .setDescription('Learn TidalCycles!'),
  new SlashCommandBuilder()
    .setName('tidal-samples')
    .setDescription('Sample List!'),
  new SlashCommandBuilder()
    .setName('tidal-docs')
    .setDescription('Documentation!'),
  new SlashCommandBuilder()
    .setName('random')
    .setDescription('Give me some random tidalcycles code!'),
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.BOTTOKEN);

rest
  .put(
    Routes.applicationGuildCommands(process.env.clientId, process.env.guildId),
    { body: commands }
  )
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);
