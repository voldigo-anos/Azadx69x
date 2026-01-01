const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "coupledp",
    aliases: ["cdp"],
    version: "2.2",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    shortDescription: "Fetch couple",
    longDescription: "couple dp",
    category: "image",
    guide: "{pn}"
  },

  onStart: async function({ api, event, args }) {
    let loadingMsg;
    try {
      const loadingText = "𝙁𝙚𝙩𝙘𝙝𝙞𝙣𝙜 𝙮𝙤𝙪𝙧 𝙘𝙤𝙪𝙥𝙡𝙚 𝙙𝙥...🌸";
      loadingMsg = await api.sendMessage(loadingText, event.threadID);
      
      const response = await axios.get("https://azadx69x-x69x-top.vercel.app/api/azadx69x", {
        params: { query: args.join(" ") || "default" }
      });

      const data = response.data;
      if (!data?.boy || !data?.girl) throw new Error("Missing boy/girl images in API.");
      
      if (loadingMsg) await api.unsendMessage(loadingMsg.messageID);
      
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const boyPath = path.join(cacheDir, `boy_${Date.now()}.jpg`);
      const girlPath = path.join(cacheDir, `girl_${Date.now()}.jpg`);

      const [boyImage, girlImage] = await Promise.all([
        axios.get(data.boy, { responseType: "arraybuffer" }),
        axios.get(data.girl, { responseType: "arraybuffer" })
      ]);

      fs.writeFileSync(boyPath, boyImage.data);
      fs.writeFileSync(girlPath, girlImage.data);

      const resultText = "💞 𝙃𝙚𝙧𝙚'𝙨 𝙮𝙤𝙪𝙧 𝙧𝙖𝙣𝙙𝙤𝙢 𝙘𝙤𝙪𝙥𝙡𝙚 𝙙𝙥:";

      await api.sendMessage({
        body: resultText,
        attachment: [
          fs.createReadStream(boyPath),
          fs.createReadStream(girlPath)
        ]
      }, event.threadID, event.messageID);
      
      fs.unlinkSync(boyPath);
      fs.unlinkSync(girlPath);

    } catch (err) {
      console.error(err);
      if (loadingMsg) await api.unsendMessage(loadingMsg.messageID);
      await api.sendMessage("❌ 𝙁𝙖𝙞𝙡𝙚𝙙 𝙩𝙤 𝙛𝙚𝙩𝙘𝙝 𝙘𝙤𝙪𝙥𝙡𝙚 𝙙𝙥.", event.threadID, event.messageID);
    }
  }
};
