const express = require('express')
const rateLimit = require('express-rate-limit')
const axios = require("axios").default
const xmlparser = require("xml-js")
const prettyMilliseconds = require("pretty-ms")
const Discord = require('discord.js')
const { Intents, MessageEmbed, Permissions } = require('discord.js')
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES
    ]
})
const token = "OTYzMzE1MTE2NzcyODE4OTQ0.YlUTHQ.dvlf1aWxz5hC-agFgxZLLBJHWow"
const app = express()
app.use(express.json())
const port = process.env.PORT || 8080
const Version = 'V1'
app.listen(port, () => {
    console.log(`Rest API listening on port ${port}`)
})
app.set('trust proxy', true)
process.on('unhandledRejection', error => console.error(error))



// Settings //
const prefix = ".."
var Memory = []
BotLockdown = true
User_Slow_Down_Rate_Limiter_Memory = []
var ImageID_Memory = []



const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, //1 Minutes
	max: 60,
	standardHeaders: true,
	legacyHeaders: false,
    handler: function (req, res, next, options) {
        console.log(req.headers['host'],' has reached the rate limit!')

        if (req.headers['roblox-id']) {
            console.log(`Warning ${req.headers['roblox-id']}!`)

            const Embed = new Discord.MessageEmbed()
            .setDescription(`${req.headers['roblox-id']} has reached the rate limit!`)
            .setColor('BLUE')
            .setFooter({ text: 'Blueprint ImageID Converter' })
            .setTimestamp()

            client.channels.cache.get('947389966231695391').send({ embeds: [Embed] })
            .catch(console.error)
        }

		res.status(options.statusCode).send(options.message)
    },
})



//Status
app.get('/', limiter, async (req, res) => {
    res.status('200').json({status: 'Online!', 'Version': Version})
})

//ImageID Converter
app.get('/:ID', limiter, async (req, res) => {
    if (!RobloxCheck(req, res)) return
    let imageId = req.params.ID

    if (ImageID_Memory[imageId]) {
        const result = ImageID_Memory[imageId]
        res.send(result)

        Memory.push(req.headers['roblox-id'])

        const Embed = new Discord.MessageEmbed()
        .addField('PlaceID:', `${req.headers['roblox-id']}`)
        .addField('Input:', `${imageId}`)
        .addField('Result:', `${result}`)
        .addField('Link:', `https://www.roblox.com/games/${req.headers['roblox-id']}`)
        .setColor('BLUE')
        .setFooter({ text: 'Blueprint ImageID Converter' })
        .setTimestamp()

        client.channels.cache.get('947389966231695391').send({ embeds: [Embed] })
        .catch(console.error)

        return
    }

    if (imageId) {
        axios
        .get(`https://assetdelivery.roblox.com/v1/asset/?id=${imageId}`)
        .then(function(response) {
            if (response.data) {
                var xml = xmlparser.xml2json(response.data, {
                    compact: true,
                    spaces: 4
                })
                const parsedXML = JSON.parse(xml)
                const resultURL = parsedXML.roblox.Item.Properties.Content.url._text
                const result = resultURL.split("=")[1]
                res.send(result)

                Memory.push(req.headers['roblox-id'])
                ImageID_Memory[imageId] = result

                const Embed = new Discord.MessageEmbed()
                .addField('PlaceID:', `${req.headers['roblox-id']}`)
                .addField('Input:', `${imageId}`)
                .addField('Result:', `${result}`)
                .addField('Link:', `https://www.roblox.com/games/${req.headers['roblox-id']}`)
                .setColor('BLUE')
                .setFooter({ text: 'Blueprint ImageID Converter' })
                .setTimestamp()

                client.channels.cache.get('947389966231695391').send({ embeds: [Embed] })
                .catch(console.error)
            }
            else {
                res.status(500).send("Error!")
            }
        })
        .catch(function(error) {
            console.log(error);
            res.status(200).send("Already an ImageID!")
        })
    }
    else {
        res.status(500).json("Error!")
    }
})

function RobloxCheck(req, res) {
    if (req.headers['cf-connecting-ip']) {
        if (req.headers['roblox-id']) {
            return true
        }
    }
    if (req.ip == '::1') {
        console.log('Local Usage')
        return true
    }

    console.log(req.headers)

    res.status('403').json({status: 'Forbidden!'})
    return false
}



client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setStatus('online')
    client.user.setActivity('Blueprint Studios', { type: 'WATCHING' })
})



client.on("messageCreate", (message) => {
    if (message.guildId === null) return
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).trim().split(' ')
        const command = args.shift().toLowerCase()

        const ErrorEmbed = new Discord.MessageEmbed()
        .setTitle('An error has occured!')
        .setDescription('If error persists, contact Blueprint Support.')
        .setColor('RED')
        .setFooter({ text: 'Blueprint ImageID Converter' })
        .setTimestamp()

        ////// BotLockdown //////
        if (BotLockdown == true && message.author.id != '241135596959956993' && message.author.id != '234206839544348682' && message.author.id != '742660051227115600') return
        if (message.author.id == '241135596959956993' || message.author.id == '234206839544348682' || message.author.id == '742660051227115600') {
            if (command === 'botlockdown') {
                if (BotLockdown == false) {
                    BotLockdown = true
                    client.user.setStatus('dnd')
                    message.reply('Bot Lockdown Active!').catch(console.error)
                }
                else {
                    message.reply('Bot Lockdown Already Active!').catch(console.error)
                }
            }
            if (command === 'unbotlockdown') {
                if (BotLockdown == true) {
                    BotLockdown = false
                    client.user.setStatus('online')
                    message.reply('Bot Lockdown Inactive!').catch(console.error)
                }
                else {
                    message.reply('Bot Lockdown Already Inactive!').catch(console.error)
                }
            }
        }

        ////// Account Age Limiter //////
        if (Date.now() - message.author.createdTimestamp < 5256000000) { //2 months
            message.reply('Your account is too young!').catch(console.error)
            return
        }

        ////// User Slow Down Rate Limiter //////
        if (message.content.replaceAll('.', '') == '') return
        if (User_Slow_Down_Rate_Limiter_Memory[message.author.id]) {
            const Timestamp = User_Slow_Down_Rate_Limiter_Memory[message.author.id]
            const Difference = Date.now() - Timestamp
            if (message.author.id != '241135596959956993') {
                if (Difference < 5000) {
                    message.reply('Please slow down!').catch(console.error)
                    .then(SentMessage => {
                        return setTimeout(() => {
                            SentMessage.delete()
                        }, 5000-Difference+500)
                    })
                    return
                }
            }
        }
        User_Slow_Down_Rate_Limiter_Memory[message.author.id] = Date.now()
 
        ////// Commands //////
        if (command === 'help') {
            let Commands = `${prefix}help`.concat(
                `\n${prefix}botstatus`,
                `\n${prefix}image [AssetID]`,
                `\n${prefix}monitor`
            )

            const Embed = new Discord.MessageEmbed()
            .addField('Commands', Commands)
            .setColor('BLUE')
            .setFooter({ text: 'Blueprint ImageID Converter' })
            .setTimestamp()
            message.reply({ embeds: [Embed]}).catch(console.error)
        }

        if (command === 'botstatus') {
            let Uptime = prettyMilliseconds(client.uptime)

            const Embed = new Discord.MessageEmbed()
            .addField('Bot Status', 'Online!')
            .addField('Version', Version)
            .addField('Ping', `${client.ws.ping}ms`)
            .addField('Status Code', `${client.ws.status}`)
            .addField('Uptime', Uptime)
            .addField('Ready At', `${client.readyAt}`)
            .setColor('BLUE')
            .setFooter({ text: 'Blueprint ImageID Converter' })
            .setTimestamp()
            message.reply({ embeds: [Embed] }).catch(console.error)
        }

        if (command === 'image') {
            if (message.guild === null) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)
            const Guild = client.guilds.cache.find(guild => guild.id == '687883462287425546')
            Guild.members.fetch(message.author.id)
            .then(guildMember => {
                //Blueprint Team
                if (guildMember.roles.cache.has('807550843587002379')) {
                    if (args.length < 1) return message.channel.send({ embeds: [ErrorEmbed] }).catch(console.error)

                    const imageId = args[0]
                    
                    axios
                    .get(`https://assetdelivery.roblox.com/v1/asset/?id=${imageId}`)
                    .then(function(response) {
                        if (response.data) {
                            var xml = xmlparser.xml2json(response.data, {
                                compact: true,
                                spaces: 4
                            })
                            const parsedXML = JSON.parse(xml)
                            const resultURL = parsedXML.roblox.Item.Properties.Content.url._text
                            const result = resultURL.split("=")[1]

                            Memory.push('Discord')

                            const Embed = new Discord.MessageEmbed()
                            .addField('Input:', `${imageId}`)
                            .addField('Result:', `${result}`)
                            .setColor('BLUE')
                            .setFooter({ text: 'Blueprint ImageID Converter' })
                            .setTimestamp()

                            message.reply({ embeds: [Embed] })
                            .catch(function(error) {
                                console.log(error);
                                message.reply('Already an ImageID!')
                            })
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                        message.reply('Already an ImageID!')
                    })
                }
                else {
                    const Embed = new Discord.MessageEmbed()
                    .setTitle('Unauthorized')
                    .setColor('BLUE')
                    .setFooter({ text: 'Blueprint ImageID Converter' })
                    .setTimestamp()
                    message.reply({ embeds: [Embed] }).catch(console.error)
                }
            })
        }

        //Administrator Commands
        if (message.author.id == '241135596959956993') {
            if (command === 'monitor') {
                var UsageCount = []
                var UsageList = []
                for (let Usage of Memory) {
                    if (!UsageCount[Usage]) {
                        UsageCount[Usage] = 1
                        UsageList.push(Usage)
                    }
                    else {
                        UsageCount[Usage] += 1
                    }
                }
    
                setTimeout(() => {
                    var Usages = ''
                    var MinorUsages = ''
                    for (let Usage of List) {
                        if (Count[Usage] >= 20) {
                            Usages += `${Usage} (${UsageCount[Usage]})\n`
                        }
                        else {
                            MinorUsages += `${Usage} (${UsageCount[Usage]})\n`
                        }
                    }
    
                    setTimeout(() => {
                        if (Usages == '') Usages = 'Empty!'
                        if (MinorUsages == '') MinorUsages = 'Empty!'
                        setTimeout(() => {
                            const Embed = new Discord.EmbedBuilder()
                            .setTitle('BIC Monitoring System')
                            .addFields(
                                {name: 'Total Usages:', value: `${Data.length}`},
                                {name: 'Usages:', value: Usages},
                                {name: 'MinorUsages:', value: MinorUsages}
                            )
                            .setColor('BLUE')
                            .setFooter({ text: 'Blueprint ImageID Converter' })
                            .setTimestamp()
                            message.reply({ embeds: [Embed] }).catch(console.error)
                        }, 200)
                    }, 100)
                }, 100)
            }

            if (command === 'clearmonitor') {
                Memory = []

                message.reply('Cleared!')
            }
        }
    }
})



client.login(token)