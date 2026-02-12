const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_JSON_URL = "https://azadx69x-all-apis-top.vercel.app/api/alldl?url=";

function detectPlatform(url) {
  if (url.includes("tiktok.com")) return "𝙏𝙞𝙠𝙏𝙤𝙠";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠";
  if (url.includes("instagram.com")) return "𝙄𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "𝙔𝙤𝙪𝙏𝙪𝙗𝙚";
  if (url.includes("x.com") || url.includes("twitter.com")) return "𝙏𝙬𝙞𝙩𝙩𝙚𝙧 / 𝙓";
  if (url.includes("pin.it") || url.includes("pinterest.com")) return "𝙋𝙞𝙣𝙩𝙚𝙧𝙚𝙨𝙩";
  return "𝙐𝙣𝙠𝙣𝙤𝙬𝙣";
}

async function fetchDataWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, { timeout: 30000 });
      return res.data;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
}

function extractMedia(result) {
  if (result.medias && result.medias.length) {
    return result.medias.find(m => m.quality === "hd") || result.medias[0];
  }
  
  if (result.video) {
    return { url: result.video };
  }
  
  if (result.download) {
    return { url: result.download };
  }
  
  if (typeof result.result === "string" && result.result.startsWith("http")) {
    return { url: result.result };
  }
  
  if (result.images && result.images.length) {
    return { url: result.images[0], type: "image" };
  }
  if (result.gallery && result.gallery.length) {
    return { url: result.gallery[0], type: "image" };
  }

  return null;
}

module.exports = {
  config: {
    name: "autodl",
    version: "0.0.7",
    author: "Azadx69x",
    role: 0,
    category: "media",
    description: {
      en: "Auto downloads videos/from TikTok, Facebook, Instagram, YouTube, X/etc."
    },
    guide: { en: "[video_link]" }
  },

  onStart: async () => {},

  onChat: async function ({ api, event }) {
    const text = event.body || "";

    const SUPPORTED = [
      "tiktok.com",
      "facebook.com",
      "fb.watch",
      "instagram.com",
      "youtu.be",
      "youtube.com",
      "x.com",
      "twitter.com",
      "pin.it",
      "pinterest.com"
    ];

    if (!SUPPORTED.some(link => text.includes(link))) return;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    const startTime = Date.now();

    try {
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `autodl_${Date.now()}.mp4`);
      
      const data = await fetchDataWithRetry(API_JSON_URL + encodeURIComponent(text));

      if (!data?.result) throw new Error("API returned empty result");
      
      const media = extractMedia(data.result);
      if (!media || !media.url) throw new Error("API did not return any downloadable media");

      const downloadUrl = media.url;
      
      const buffer = (await axios.get(downloadUrl, { responseType: "arraybuffer", timeout: 60000 })).data;
      await fs.writeFile(filePath, Buffer.from(buffer));

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      
      const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      const speed = ((Date.now() - startTime) / 1000).toFixed(2);
      const platform = detectPlatform(text);
      
      const msg = `
╭━〔 ✅ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞 〕━╮
┃ 📊 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦  : ${platform}
┃ 📦 𝐅𝐢𝐥𝐞 𝐒𝐢𝐳𝐞 : ${fileSizeMB} MB
┃ ⚡ 𝐒𝐩𝐞𝐞𝐝     : ${speed}s
╰━━━━━━━━━━━━━━━━━━╯
👀 𝐌𝐚𝐝𝐞 𝐛𝐲 𝐀𝐳𝐚𝐝𝐱69x
`;
      
      api.sendMessage(
        { body: msg, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};
