require('dotenv').config();

const OSC = require('node-osc');

let examples = [
  'd1 $ every 4 (fast 0.75) $ note "[-12 ~ 12 7]*4" |> n "0 1 2 3" |> sound "clubkick"',
  'd1 $ every 2 (fast 1.25) $ slow 0.5 $ note "-3 12 0 ~ ~ 27" |> n "1" |> sound "sid"',
  'd1 $ palindrome $ iter 8 $ note "[-7 -3 -12 -7 ~ -24]*3" |> iter 4 (n "0 1 2 3 4 5 6 7 8") |> s "808"',
  'd1 $ every 5 (fast 8) $ iter 4 $ note "12*8 24*4? -12? ~"  |> sound "pluck"',
  'd1 $ palindrome $ every 3 (fast 2) $ iter 8 $ note "9 7? -5? -12? 30 40 -22 40 ~ 10 50 -12? ~"  |> sound "909" |>lpf 1200',
  'd1 $ note "0 [0 ~ 12? 0 ~ 1? 0]" |> n (irand 4) |> s "stab" |> pan rand |> gain rand',
  'd1 $ sound "bd*1024" |> n (irand 8) |> speed (fast 1200 $ range 0.5 1 tri) |> lpf 4000 |>lpq rand |>djf sine',
  'd1 $ s "[bd:0 bd:1, hh:1 perc? hh:3, juno sd? sd:1 sd:1] realclaps"',
  'd1 $ fast "2 4 8 16" $ sound "[bd bd bd? bd, ~ hh? ~ hh, bass3]"',
  'd1 $ every 4 (zoom (0.25, 0.35)) $ sound "jungle*2 hh*3 [sn bd]*2 drum"+sine |> lpf 2000',
  'd1 $ fast 2 $ sound "[reverbkick(3,8), sn(3,7)?]" |> djf rand',
  'd1 $ sound $ samples "[drum*8, rave:3, ~ ~ sn ~ ~ ~ sn ~, bass:3 ~ ~ ~ ~ ~ ~ ~]" "[0 2 0 2 0 2 0 2]"',
  'd1 $ sound "808:1*16 808:2*16" |> speed (range 1 3 $ tri) |> pan (fast 8 $ ((range 0.4 0.6 square)+((rand*0.6)-0.3)))',
  'd1 $ every 5 (|+| speed "10") $ every 4 (0.25 <~) $ every 3 (rev) $ sound "rave*128" |> speed "[1 1.25 0.75 -1.5]/3" |> lpf 200 |> hpf 199 |> pan (fast 16 $ sine)',
  'd1 $ note (choose [0,7,0,19,7,24,-12]-((irand 3)*12)) |> sound (choose ["supersaw", "supergong", "808", "909"]) |> lpf (irand 8000) |> room "0.6" |> size "0.6"',
  'd1 $ every 3 (slow 4) $ every 2 (fast 2) $ n "0*24" |> note (choose [0,3,7,10,50]) |- note ((irand 5)*12) |+ note "12" |> sound "superpiano" |> lpf 800 |> lpq (range 0 0.5 rand)',
  'd1 $ every 2 (0.125 <~) $ every 3 (0.1 <~) $ every 5 (0.2 <~) $ note "[12 0 -24, 50 32 53 20, 2 4 3 5 3, 28 39, 48 39 23 50 51 52 53]" |> sound "supergong"',
  'd1 $ s "[bd*16, sd*16, hh*32]" |> djf (fast (irand 4) $ sine) |> pan ((rand*0.5)+0.25)',
  'd1 $ degradeBy 0.4 $ stack [note "[0 1 2 ~ ~ 3 -12 -24 ~ 2 -10]" |> pan (rand*0.75) |> room 0.3, note "[12 12 12 12 12 ~]*2" |> pan (rand*0.75+0.25) |> room 0.6]  |> s (choose ["supergong", "supermandolin"]) |> djf rand |> delay (rand * 8)',
];

// Require the necessary discord.js classes
const { Client, Intents, Message } = require('discord.js');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const oscClient = new OSC.Client('127.0.0.1', 6011);
var oscServer = new OSC.Server(6012, '127.0.0.1');

oscServer.on('listening', () => {
  console.log('OSC Server is listening.');
});

oscServer.on('message', msg => {
  if (msg[0].startsWith('/code/ok')) {
    console.log('CODE OK');
    let interaction = lastMessagesFrom.shift();
    if (lastMessage) {
      lastMessage.deleteReply();
    }
    const regex = /^(d)(\d+)/g;
    const found = [...interaction[1][2].matchAll(regex)];
    lastMessage = interaction[0];
    let strUN = `${interaction[1][2]} \\\\${interaction[0].user.username}`;
    activeStreams[found[0][2] - 1] = strUN;
    let streams = '';
    activeStreams.forEach(track => {
      if (track && track !== '') {
        streams += `\n${track}`;
      }
    });
    interaction[0].reply(`Active tracks!\n\`\`\`haskell\n${streams}\`\`\``);
  }
  if (msg[0].startsWith('/code/error')) {
    console.log('CODE OK');
    let interaction = lastMessagesFrom.shift();
    let errorMessage = msg[2].toString();
    console.log(msg);
    interaction[0].reply({
      content: errorMessage.replaceAll('\\n', '').replaceAll('*', ' * '),
      ephemeral: true,
    });
  }
});

let lastMessage;

let activeStreams = [];

client.once('ready', () => {
  console.log('Ready!');
  client.user.setUsername('livecodebot');
});

let lastMessagesFrom = [];

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'tidal') {
    let strings = [];
    let string = interaction.options.getString('input');
    if (string != undefined) {
      strings.push(string.substring(0, string.indexOf('$')));
      strings.push(string.substring(string.indexOf('$') + 1));
      strings.push(string);
      lastMessagesFrom.push([interaction, strings]);
      oscClient.send('/code', [strings[0], strings[1]], err => {
        if (err) console.error(err);
      });
    } else {
      interaction.reply({ content: 'No string supplied!', ephemeral: true });
    }
  } else if (commandName === 'tidal-tutorial') {
    await interaction.reply({
      content: `https://tidalcycles.org/docs/patternlib/tutorials/workshop`,
      ephemeral: true,
    });
  } else if (commandName === 'tidal-samples') {
    await interaction.reply({
      content: `https://github.com/tidalcycles/Dirt-Samples`,
      ephemeral: true,
    });
  } else if (commandName === 'tidal-docs') {
    await interaction.reply({
      content: `http://tidalcycles.org/docs/`,
      ephemeral: true,
    });
  } else if (commandName === 'random') {
    let code = examples[Math.floor(Math.random() * examples.length)].replaceAll(
      '\\',
      ''
    );
    await interaction.reply({
      content: code,
      ephemeral: true,
    });
  }
});

client.login(process.env.BOTTOKEN);
