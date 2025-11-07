const axios = require("axios");

const cmdsInfoUrl = "https://raw.githubusercontent.com/azad-s-api-web/Azadxxx-blackmarket/refs/heads/main/cmdsinfo.json";
const cmdsUrlJson = "https://raw.githubusercontent.com/azad-s-api-web/Azadxxx-blackmarket/refs/heads/main/cmdsurl.json";

const ITEMS_PER_PAGE = 10;

module.exports = {
  config: {
    name: "blackmarket",
    aliases: ["bm"],
    version: "2.2",
    author: "Azad 💥",//author change korle tor marechudi 
    role: 0,
    shortDescription: "List or show blackmarket commands",
    category: "market",
  },

  onStart: async function({ message, args }) {
    try {
      const action = args[0]?.toLowerCase();

      if (!action) {
        return message.reply(
          "✨𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼 𝗕𝗹𝗮𝗰𝗸 𝗠𝗮𝗿𝗸𝗲𝘁 ✨\n" +
          "👤 Author: Azad 💥\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "Type )bm list <page> to see all commands.\n" +
          "Type )bm show <command>.js to see code."
        );
      }

      const [infoRes, urlRes] = await Promise.all([
        axios.get(cmdsInfoUrl),
        axios.get(cmdsUrlJson)
      ]);

      let cmdsInfo = infoRes.data;
      if (cmdsInfo.cmdName) cmdsInfo = cmdsInfo.cmdName;
      const cmdsUrls = urlRes.data;

      if (action === "list") {
        if (!Array.isArray(cmdsInfo) || cmdsInfo.length === 0)
          return message.reply("❌ No commands found!");

        const page = parseInt(args[1]) || 1;
        const totalPages = Math.ceil(cmdsInfo.length / ITEMS_PER_PAGE);

        if (page < 1 || page > totalPages)
          return message.reply(`❌ Invalid page number! 1-${totalPages}`);

        const start = (page - 1) * ITEMS_PER_PAGE;
        const cmdsPage = cmdsInfo.slice(start, start + ITEMS_PER_PAGE);

        let text = `✨𝗕𝗹𝗮𝗰𝗸 𝗠𝗮𝗿𝗸𝗲𝘁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗟𝗶𝘀𝘁 ✨\n👤 Author: Azad 💥\n━━━━━━━━━━━━━━━━━━━━\n`;

        cmdsPage.forEach((c, i) => {
          text += `🪪 Number  : ${start + i + 1}\n` +
                  `🛒 Name    : ${c.cmd}\n` +
                  `⚙️ Update  : ${c.update}\n` +
                  `👨‍💻 Author : ${c.author}\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n`;
        });

        if (page < totalPages) text += `📑 Type ")bm list ${page + 1}" for next page.`;

        return message.reply(text.trim());
      }

      if (action === "show") {
        const cmdName = args[1]?.replace(".js", "");
        if (!cmdName) return message.reply("❌ Please provide a command name!\nExample: )bm show anime.js");

        const cmd = cmdsInfo.find(c => c.cmd.toLowerCase() === cmdName.toLowerCase());
        const cmdUrl = cmdsUrls[cmdName];

        if (!cmd || !cmdUrl) return message.reply(`❌ Command "${cmdName}" not found!`);

        const res = await axios.get(cmdUrl);
        let code = res.data;

        if (code.length > 4000) code = code.slice(0, 4000) + "\n... (truncated)";

        return message.reply(`📄 ${cmdName}.js\n\`\`\`js\n${code}\n\`\`\``);
      }

      return message.reply("❌ Invalid option!\nUse )bm list <page> or )bm show <command>.js");

    } catch (err) {
      console.error(err);
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
