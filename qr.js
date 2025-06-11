const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const QRCode = require('qrcode'); // Add qrcode library
const router = express.Router();
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/server', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    
    async function ZUKO_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                syncFullHistory: false,
                browser: Browsers.macOS('Safari'),
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                // Generate QR code from the pairing code
                const qrImage = await QRCode.toBuffer(`https://wa.me/${num}?code=${code}`, {
                    type: 'png',
                    scale: 8,
                });
                res.set('Content-Type', 'image/png');
                res.send(qrImage); // Serve the QR code image
            }

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === 'open') {
                    await delay(5000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    let rf = __dirname + `/temp/${id}/creds.json`;
                    function generateRandomText() {
                        const prefix = '3EB';
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let randomText = prefix;
                        for (let i = prefix.length; i < 22; i++) {
                            const randomIndex = Math.floor(Math.random() * characters.length);
                            randomText += characters.charAt(randomIndex);
                        }
                        return randomText;
                    }
                    const randomText = generateRandomText();
                    try {
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let md = 'ZUKO~' + string_session;
                        let code = await sock.sendMessage(sock.user.id, { text: md });
                        let desc = `*Hello there ZUKO-MD User! 👋🏻* 

> Do not share your session id with your gf 😂.

 *Thanks for using ZUKO-MD 🚩* 

> Join WhatsApp Channel :- ⤵️
 
https://whatsapp.com/channel/0029VaySwxF9Bb67U6rkUB2i

Dont forget to fork the repo ⬇️

https://github.com/Neggy5/ZUKO-MD

> *© Powered BY ZUKO 🖤*`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: 'ZUKO-MD',
                                    thumbnailUrl: 'https://files.catbox.moe/vn037q.jpg',
                                    sourceUrl: 'https://whatsapp.com/channel/0029VaySwxF9Bb67U6rkUB2i',
                                    mediaType: 1,
                                    renderLargerThumbnail: true,
                                },
                            },
                        }, { quoted: code });
                    } catch (e) {
                        let ddd = sock.sendMessage(sock.user.id, { text: e.toString() });
                        let desc = `*Don't Share with anyone this code use for deploy ZUKO-MD*\n\n ◦ *Github:* https://github.com/Neggy5/ZUKO-MD`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: 'ZUKO-MD',
                                    thumbnailUrl: 'https://files.catbox.moe/vn037q.jpg',
                                    sourceUrl: 'https://whatsapp.com/channel/0029VaySwxF9Bb67U6rkUB2i',
                                    mediaType: 2,
                                    renderLargerThumbnail: true,
                                    showAdAttribution: true,
                                },
                            },
                        }, { quoted: ddd });
                    }
                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...`);
                    await delay(10);
                    process.exit();
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10);
                    ZUKO_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log('service restarted');
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.status(500).send('Error generating QR code');
            }
        }
    }

    return await ZUKO_MD_PAIR_CODE();
});

module.exports = router;
