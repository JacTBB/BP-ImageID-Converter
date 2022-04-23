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

                const Embed = new Discord.MessageEmbed()
                .addField('PlaceID:', `${req.headers['roblox-id']}`)
                .addField('Input:', `${imageId}`)
                .addField('Result:', `${result}`)
                .addField('Link:', `https://www.roblox.com/games/${req.headers['roblox-id']}`)
                .setColor('BLUE')
                .setFooter({ text: 'Blueprint ImageID Converter' })
                .setTimestamp()

                client.channels.cache.get('947389966231695391').send({ embeds: [Embed] })
                .catch(console.error)}
            else {
                res.status(500).send("Error!")
            }
        })
        .catch(function(error) {
            console.log(error);
            res.status(500).send("Error!")
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
    if (message.author.id != '241135596959956993') return
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).trim().split(' ')
        const command = args.shift().toLowerCase()

        ////// Commands //////
        if (command === 'help') {
            let Commands = `${prefix}help`.concat(
                `\n${prefix}botstatus`,
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
            .addField('Stauts Code', `${client.ws.status}`)
            .addField('Uptime', Uptime)
            .addField('Ready At', `${client.readyAt}`)
            .setColor('BLUE')
            .setFooter({ text: 'Blueprint ImageID Converter' })
            .setTimestamp()
            message.reply({ embeds: [Embed] }).catch(console.error)
        }

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
                for (let Usage of UsageList) {
                    Usages += `${Usage} (${UsageCount[Usage]})\n`
                }

                setTimeout(() => {
                    if (Usages == '') return message.reply('Empty!')
    
                    const Embed = new Discord.MessageEmbed()
                    .setTitle('BIC Monitoring System')
                    .addField('Memory', Usages)
                    .setColor('BLUE')
                    .setFooter({ text: 'Blueprint ImageID Converter' })
                    .setTimestamp()
                    message.reply({ embeds: [Embed] }).catch(console.error)
                }, 100)
            }, 100)
        }
    }
})



client.login(token)