const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anime",
    aliases: ["ani"],
    version: "0.0.8",
    author: "Azadx69x",
    role: 0,
    shortDescription: "Random Anime Video",
    longDescription: "random anime videos.",
    category: "media",
    guide: { en: "{p}anime" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      api.setMessageReaction("🎌", messageID, () => {}, true);
        
      const response = await axios.get("https://azadx69x-all-apis-top.vercel.app/api/anime-video");
      const videoUrl = response.data.video_url;

      if (!videoUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("⚠️ Couldn't fetch anime video!", threadID, messageID);
      }
        
      const videoPath = path.join(__dirname, "anime.mp4");
      const videoBuffer = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(videoPath, Buffer.from(videoBuffer.data));
        
      const bodyText = "🌸✨ 𝙔𝙤𝙪𝙧 𝑹𝒂𝒏𝒅𝒐𝒎 𝘼𝙣𝙞𝙢𝙚 𝙑𝙞𝙙𝙚𝙤 ✨🌸";
        
      api.sendMessage(
        {
          body: bodyText,
          attachment: fs.createReadStream(videoPath)
        },
        threadID,
        (err) => {
          fs.unlinkSync(videoPath);
            
          if (!err) {
            api.setMessageReaction("✔️", messageID, () => {}, true);
          } else {
            api.setMessageReaction("❌", messageID, () => {}, true);
          }
        }
      );

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ Error fetching anime video!", threadID, messageID);
    }
  }
};
