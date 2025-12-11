const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

// Register a default font if available in assets (non-fatal)
try {
  registerFont(path.join(__dirname, "assets", "font", "BebasNeue-Regular.ttf"), { family: "Bebas" });
} catch (e) { /* ignore if font not present */ }

const BANK_NAME = "Premium Digital Bank";
const CURRENCY_SYMBOL = "$";
const CARD_LOGO_TEXT = "Premium Wallet";
const CACHE_DIR = path.join(__dirname, "cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });

module.exports = {
  config: {
    name: "bank",
    version: "4.0",
    author: "Azadx69",
    role: 0,
    shortDescription: "Full Banking System (cards, savings, statements)",
    longDescription: "Complete banking with ATM card generator (premium), transactions, savings, statements, and multi-card support.",
    category: "finance",
  },

  // ------------------ Utilities ------------------
  formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return `${CURRENCY_SYMBOL}0`;
    amount = Number(amount);
    const abs = Math.abs(amount);
    const scales = [
      { value: 1e15, suffix: 'Q' },
      { value: 1e12, suffix: 'T' },
      { value: 1e9, suffix: 'B' },
      { value: 1e6, suffix: 'M' },
      { value: 1e3, suffix: 'k' }
    ];
    for (let scale of scales) {
      if (abs >= scale.value) {
        let val = amount / scale.value;
        const text = (val % 1 === 0) ? `${val}${scale.suffix}` : `${val.toFixed(2)}${scale.suffix}`;
        return `${CURRENCY_SYMBOL}${text}`;
      }
    }
    return `${CURRENCY_SYMBOL}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  },

  generateCardNumber() {
    // Use prefix 5284 like original, ensure unique-ish
    return "5284 " +
      ("" + Math.floor(1000 + Math.random() * 9000)) + " " +
      ("" + Math.floor(1000 + Math.random() * 9000)) + " " +
      ("" + Math.floor(1000 + Math.random() * 9000));
  },

  generateCVV() { return Math.floor(100 + Math.random() * 900).toString(); },
  generatePIN() { return Math.floor(1000 + Math.random() * 9000).toString(); },

  getExpiry() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear() + 4;
    return `${month.toString().padStart(2, "0")}/${String(year).slice(-2)}`;
  },

  generateAccountNumber() {
    // 10-digit account number
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  },

  generateTransactionId() {
    const t = Date.now().toString(36);
    const r = Math.floor(1000 + Math.random() * 9000).toString(36);
    return `TX-${t}-${r}`.toUpperCase();
  },

  nowISO() {
    return new Date().toISOString();
  },

  // ------------------ Configurable limits ------------------
  SYSTEM: {
    MIN_DEPOSIT: 1,
    MIN_WITHDRAW: 1,
    MIN_TRANSFER: 1,
    DAILY_TRANSFER_LIMIT: 50000, // currency units per day
    DAILY_WITHDRAW_LIMIT: 20000,
    MAX_CARDS_PER_USER: 3
  },

  // ------------------ Card designs ------------------
  cardDesigns: {
    premium: {
      gradient: ["#0b0f14", "#1a1a1a", "#2b2b2b"],
      accent: "#d4af37",
      chipColor: "#b8860b",
      hologramColors: ["#c8a454", "#f4d68d"],
      textLight: "#ffffff",
      textMuted: "#cfcfcf"
    },
    blue: {
      gradient: ["#0f172a", "#03203c", "#08324b"],
      accent: "#66c0ff",
      chipColor: "#c0d8ff",
      hologramColors: ["#5ad1ff", "#8ee9ff"],
      textLight: "#ffffff",
      textMuted: "#c8d8e8"
    }
  },

  // ------------------ Card generator (Professional) ------------------
  async createRealCard(card, username = "User", balance = 0, transactions = [], designKey = "premium") {
    const width = 900, height = 560;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const d = this.cardDesigns[designKey] || this.cardDesigns.premium;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, d.gradient[0]);
    bg.addColorStop(0.5, d.gradient[1]);
    bg.addColorStop(1, d.gradient[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle pattern overlay
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      ctx.arc(40 + (i * 10) % width, (i * 7) % height, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = d.accent;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Top-right logo text
    ctx.font = "bold 36px Bebas, sans-serif";
    ctx.fillStyle = d.accent;
    ctx.textAlign = "right";
    ctx.fillText(CARD_LOGO_TEXT, width - 40, 70);

    // Chip (detailed)
    const chipX = 60, chipY = 150, chipW = 140, chipH = 86;
    ctx.fillStyle = d.chipColor;
    roundRect(ctx, chipX, chipY, chipW, chipH, 8, true, false);
    // chip inner lines
    ctx.strokeStyle = "#7a5d18";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chipX + 10, chipY + 28); ctx.lineTo(chipX + chipW - 10, chipY + 28);
    ctx.moveTo(chipX + 10, chipY + 46); ctx.lineTo(chipX + chipW - 10, chipY + 46);
    ctx.stroke();

    // Embossed card number (draw outer text then inner light to simulate emboss)
    ctx.textAlign = "left";
    ctx.font = "48px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.06)"; // shadowed emboss
    ctx.fillText(card.number, 60, 340);
    // highlight
    ctx.fillStyle = d.textLight;
    ctx.fillText(card.number, 62, 336);

    // Username (lower left)
    ctx.font = "28px sans-serif";
    ctx.fillStyle = d.textMuted;
    ctx.fillText(username.toUpperCase(), 60, 420);
    // Small label
    ctx.font = "18px sans-serif";
    ctx.fillStyle = d.textMuted;
    ctx.fillText("CARDHOLDER", 60, 400);

    // Expiry (right)
    ctx.textAlign = "right";
    ctx.font = "20px sans-serif";
    ctx.fillStyle = d.textMuted;
    ctx.fillText("VALID THRU", width - 60, 300);
    ctx.font = "36px monospace";
    ctx.fillStyle = d.textLight;
    ctx.fillText(card.expiry, width - 60, 340);

    // CVV area - hidden with stars
    ctx.font = "20px sans-serif";
    ctx.fillStyle = d.textMuted;
    ctx.textAlign = "right";
    ctx.fillText("CVV", width - 60, 400);
    ctx.font = "28px monospace";
    ctx.fillStyle = d.textLight;
    ctx.fillText("***", width - 60, 430);

    // Balance (bottom-right)
    ctx.font = "24px sans-serif";
    ctx.fillStyle = d.accent;
    ctx.textAlign = "right";
    ctx.fillText(`Balance: ${this.formatMoney(balance)}`, width - 60, height - 40);

    // Last transaction (if any) bottom-left
    if (transactions && transactions.length) {
      const lastTx = transactions[transactions.length - 1];
      const typeSymbol = lastTx.type === "sent" ? "➡️" : "⬅️";
      const amountText = `${this.formatMoney(lastTx.amount)}`;
      const info = `${typeSymbol} ${amountText} ${lastTx.type === "sent" ? "Sent" : "Received"}`;
      ctx.textAlign = "left";
      ctx.font = "20px sans-serif";
      ctx.fillStyle = d.textMuted;
      ctx.fillText(info, 60, height - 40);
    }

    // Hologram circles (decorative)
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(width - 140, 90, 36, 0, Math.PI * 2); ctx.fillStyle = d.hologramColors[0]; ctx.fill();
    ctx.beginPath(); ctx.arc(width - 100, 90, 28, 0, Math.PI * 2); ctx.fillStyle = d.hologramColors[1]; ctx.fill();
    ctx.globalAlpha = 1;

    // Signature strip (top-right small)
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, 380, 480, 380, 38, 6, true, false);

    // Save canvas to file
    const filePath = path.join(CACHE_DIR, `${Date.now()}_card.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    return filePath;

    // ----- helper: rounded rect -----
    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
      if (typeof r === 'undefined') r = 5;
      if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
      ctx.beginPath();
      ctx.moveTo(x + r.tl, y);
      ctx.lineTo(x + w - r.tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
      ctx.lineTo(x + w, y + h - r.br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
      ctx.lineTo(x + r.bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
      ctx.lineTo(x, y + r.tl);
      ctx.quadraticCurveTo(x, y, x + r.tl, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
  },

  // ------------------ Language strings ------------------
  langs: {
    en: {
      menu: `
     🏦 ${BANK_NAME}
══════════════════════
 📋 BANKING SERVICES:

 💰 deposit <amount> - Deposit
 💸 withdraw <amount> - Withdraw
 🔁 transfer <uid> <amount> - Transfer
 📊 balance - Balance
 📜 history - History
 💳 card apply - Apply ATM Card
 💳 card list - List your cards
 💳 card show <id> - Show card (image)
 💳 card block <id> - Block a card
 💳 card activate <id> - Activate a card
 🏧 savings deposit <amount> - Save money
 🏧 savings withdraw <amount> - Withdraw savings
 📑 statement - Account statement
 ❓ bank help - Show this menu
`,
      notRegistered: "❌ You don't have a bank account!\nUse: `bank register` to sign up",
      alreadyRegistered: "✅ You already have a bank account!",
      registered: `🎉 REGISTRATION SUCCESSFUL!

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
📋 Account No: %1
💰 Balance: ${CURRENCY_SYMBOL}0
📅 Opened: %2
━━━━━━━━━━━━━━━━━
Welcome to ${BANK_NAME}!`,
      balance: `💳 ACCOUNT INFORMATION

🏦 ${BANK_NAME}
━━━━━━━━━━━━━━━━━
👤 Holder: %1
📋 Account: %2
💰 Balance: %3
💎 Savings: %4
━━━━━━━━━━━━━━━━━`,
      depositSuccess: "✅ Deposit successful!",
      withdrawSuccess: "✅ Withdrawal successful!",
      transferSuccess: "✅ Transfer successful!",
      invalidAmount: "❌ Invalid amount!",
      insufficientBalance: "❌ Insufficient bank balance!",
      insufficientWallet: "❌ Insufficient wallet balance!",
      minDeposit: `❌ Minimum deposit is ${CURRENCY_SYMBOL}${1}`,
      minWithdraw: `❌ Minimum withdrawal is ${CURRENCY_SYMBOL}${1}`,
      minTransfer: `❌ Minimum transfer is ${CURRENCY_SYMBOL}${1}`,
      dailyLimitReached: "❌ You've reached today's transaction limit!",
      noTransactions: "📭 No transactions yet!",
      noCard: "❌ You don't have an ATM card!\nUse: bank card apply",
      cardApplied: "✅ Card application successful! Card ID: %1 | PIN: %2",
      cardActivated: "✅ Card has been activated!",
      cardBlocked: "✅ Card has been blocked!",
      pinChanged: "✅ PIN changed successfully!",
      invalidPin: "❌ PIN must be 4 digits!",
      savingsDeposited: "✅ Savings deposit successful!",
      savingsWithdrawn: "✅ Savings withdrawal successful!",
      noSavings: "❌ You have no savings!"
    }
  },

  // ------------------ Main command handler ------------------
  async onStart({ message, args, usersData, event }) {
    try {
      const uid = event.senderID;
      const action = (args[0] || "").toLowerCase();
      let userData = await usersData.get(uid);
      if (!userData.data) userData.data = {};
      if (!userData.data.bank) {
        userData.data.bank = {
          accountNumber: this.generateAccountNumber(),
          balance: 0,
          savings: 0,
          registered: false,
          cards: [], // array of card objects {id, number, cvv, pin, expiry, active, type, createdAt}
          transactions: [], // each: { transactionId, type, amount, from?, to?, timestamp }
          totalDeposited: 0,
          totalWithdrawn: 0,
          totalTransferred: 0,
          daily: { // daily counters reset not implemented server-side — it's illustrative; you may implement reset by date
            transferredToday: 0,
            withdrawnToday: 0,
            lastReset: this.nowISO()
          },
          createdAt: this.nowISO()
        };
      }

      // ------------------ Helper local functions ------------------
      const saveUser = async () => await usersData.set(uid, { data: userData.data });
      const findCardById = (id) => {
        return userData.data.bank.cards.find(c => c.id === id);
      };

      // ---------- NO-REGISTER BLOCK ----------
      if (action === "register") {
        if (userData.data.bank.registered) return message.reply(this.langs.en.alreadyRegistered);
        userData.data.bank.registered = true;
        userData.data.bank.createdAt = this.nowISO();
        await usersData.set(uid, { data: userData.data });
        return message.reply(this.langs.en.registered.replace("%1", userData.data.bank.accountNumber).replace("%2", userData.data.bank.createdAt));
      }

      if (!userData.data.bank.registered) {
        return message.reply(this.langs.en.notRegistered);
      }

      // ---------- HELP / MENU ----------
      if (action === "help" || action === "menu" || action === "start") {
        return message.reply(this.langs.en.menu);
      }

      // ---------- BALANCE ----------
      if (action === "balance") {
        const balText = this.langs.en.balance
          .replace("%1", userData.name || "User")
          .replace("%2", userData.data.bank.accountNumber)
          .replace("%3", this.formatMoney(userData.data.bank.balance))
          .replace("%4", this.formatMoney(userData.data.bank.savings || 0));
        return message.reply(balText);
      }

      // ---------- DEPOSIT ----------
      if (action === "deposit") {
        const amount = parseFloat(args[1]);
        if (isNaN(amount) || amount < this.SYSTEM.MIN_DEPOSIT) return message.reply(this.langs.en.invalidAmount);
        userData.data.bank.balance += amount;
        userData.data.bank.transactions.push({
          transactionId: this.generateTransactionId(),
          type: "deposit",
          amount,
          from: "Wallet/External",
          timestamp: this.nowISO()
        });
        userData.data.bank.totalDeposited = (userData.data.bank.totalDeposited || 0) + amount;
        await saveUser();
        return message.reply(`${this.langs.en.depositSuccess}\n💰 ${this.formatMoney(amount)} deposited.\n💳 New Balance: ${this.formatMoney(userData.data.bank.balance)}`);
      }

      // ---------- WITHDRAW ----------
      if (action === "withdraw") {
        const amount = parseFloat(args[1]);
        if (isNaN(amount) || amount < this.SYSTEM.MIN_WITHDRAW) return message.reply(this.langs.en.invalidAmount);
        if (amount > userData.data.bank.balance) return message.reply(this.langs.en.insufficientBalance);
        // daily limit check
        if ((userData.data.bank.daily.withdrawnToday || 0) + amount > this.SYSTEM.DAILY_WITHDRAW_LIMIT) return message.reply(this.langs.en.dailyLimitReached);
        userData.data.bank.balance -= amount;
        userData.data.bank.transactions.push({
          transactionId: this.generateTransactionId(),
          type: "withdraw",
          amount,
          to: "Cash/External",
          timestamp: this.nowISO()
        });
        userData.data.bank.totalWithdrawn = (userData.data.bank.totalWithdrawn || 0) + amount;
        userData.data.bank.daily.withdrawnToday = (userData.data.bank.daily.withdrawnToday || 0) + amount;
        await saveUser();
        return message.reply(`${this.langs.en.withdrawSuccess}\n💸 ${this.formatMoney(amount)} withdrawn.\n💳 New Balance: ${this.formatMoney(userData.data.bank.balance)}`);
      }

      // ---------- TRANSFER / SEND ----------
      if (action === "transfer" || action === "send") {
        const target = args[1];
        const amount = parseFloat(args[2]);
        if (!target) return message.reply("❌ Please specify recipient UID.");
        if (isNaN(amount) || amount < this.SYSTEM.MIN_TRANSFER) return message.reply(this.langs.en.invalidAmount);
        if (amount > userData.data.bank.balance) return message.reply(this.langs.en.insufficientBalance);
        // daily transfer limit
        if ((userData.data.bank.daily.transferredToday || 0) + amount > this.SYSTEM.DAILY_TRANSFER_LIMIT) return message.reply(this.langs.en.dailyLimitReached);

        let targetData = await usersData.get(target);
        if (!targetData || !targetData.data || !targetData.data.bank || !targetData.data.bank.registered) {
          return message.reply("❌ Recipient does not have a bank account.");
        }

        // perform transfer
        userData.data.bank.balance -= amount;
        targetData.data.bank.balance = (targetData.data.bank.balance || 0) + amount;

        const txId = this.generateTransactionId();
        const timestamp = this.nowISO();

        userData.data.bank.transactions.push({
          transactionId: txId,
          type: "transfer",
          amount,
          to: targetData.name || target,
          timestamp
        });
        targetData.data.bank.transactions.push({
          transactionId: txId,
          type: "received",
          amount,
          from: userData.name || uid,
          timestamp
        });

        userData.data.bank.totalTransferred = (userData.data.bank.totalTransferred || 0) + amount;
        userData.data.bank.daily.transferredToday = (userData.data.bank.daily.transferredToday || 0) + amount;

        await usersData.set(target, { data: targetData.data });
        await saveUser();

        const receipt = `🔄 TRANSFER SUCCESS
━━━━━━━━━━━━━━━━━
📤 From: ${userData.name || uid}
📥 To: ${targetData.name || target}
💰 Amount: ${this.formatMoney(amount)}
💳 Your Balance: ${this.formatMoney(userData.data.bank.balance)}
🔖 ID: ${txId}`;

        return message.reply(receipt);
      }

      // ---------- HISTORY ----------
      if (action === "history") {
        const txs = userData.data.bank.transactions || [];
        if (!txs.length) return message.reply(this.langs.en.noTransactions);
        let historyMsg = `📜 TRANSACTION HISTORY\n━━━━━━━━━━━━━━━━━\n`;
        const recent = txs.slice(-10).reverse();
        recent.forEach((tx, i) => {
          const icon = tx.type === "deposit" ? "💰" :
            tx.type === "withdraw" ? "💸" :
              tx.type === "transfer" ? "📤" :
                tx.type === "received" ? "📥" : "📋";
          const sign = ["deposit", "received"].includes(tx.type) ? "+" : "-";
          const date = new Date(tx.timestamp).toLocaleString();
          historyMsg += `${i + 1}. ${icon} ${tx.type.toUpperCase()}\n   ${sign}${this.formatMoney(tx.amount)} | ${date}\n   ID: ${tx.transactionId}\n`;
        });
        return message.reply(historyMsg);
      }

      // ---------- STATEMENT ----------
      if (action === "statement") {
        const bd = userData.data.bank;
        let statementMsg = `📑 ACCOUNT STATEMENT
━━━━━━━━━━━━━━━━━━━━━
🏦 ${BANK_NAME}
👤 ${userData.name || "User"}
📋 ${bd.accountNumber}
━━━━━━━━━━━━━━━━━━━━━

💰 Current Balance: ${this.formatMoney(bd.balance)}
💎 Savings: ${this.formatMoney(bd.savings || 0)}

📊 STATISTICS
━━━━━━━━━━━━━━━━━━━━━
📥 Total Deposited: ${this.formatMoney(bd.totalDeposited || 0)}
📤 Total Withdrawn: ${this.formatMoney(bd.totalWithdrawn || 0)}
🔄 Total Transferred: ${this.formatMoney(bd.totalTransferred || 0)}

💳 CARDS: ${bd.cards ? bd.cards.length : 0}
📋 Transactions: ${bd.transactions.length || 0}

📅 Account Opened: ${bd.createdAt}
━━━━━━━━━━━━━━━━━━━━━
Thank you for banking with us!`;
        return message.reply(statementMsg);
      }

      // ---------- SAVINGS ----------
      if (action === "savings") {
        const sub = (args[1] || "").toLowerCase();
        if (sub === "deposit") {
          const amount = parseFloat(args[2]);
          if (isNaN(amount) || amount <= 0) return message.reply(this.langs.en.invalidAmount);
          if (amount > userData.data.bank.balance) return message.reply(this.langs.en.insufficientBalance);
          userData.data.bank.balance -= amount;
          userData.data.bank.savings = (userData.data.bank.savings || 0) + amount;
          userData.data.bank.transactions.push({
            transactionId: this.generateTransactionId(),
            type: "savings_deposit",
            amount,
            timestamp: this.nowISO()
          });
          await saveUser();
          return message.reply(`${this.langs.en.savingsDeposited}\n💰 ${this.formatMoney(amount)} moved to savings.\n💳 New Balance: ${this.formatMoney(userData.data.bank.balance)}`);
        } else if (sub === "withdraw") {
          const amount = parseFloat(args[2]);
          if (isNaN(amount) || amount <= 0) return message.reply(this.langs.en.invalidAmount);
          if (!userData.data.bank.savings || amount > userData.data.bank.savings) return message.reply(this.langs.en.noSavings);
          userData.data.bank.savings -= amount;
          userData.data.bank.balance += amount;
          userData.data.bank.transactions.push({
            transactionId: this.generateTransactionId(),
            type: "savings_withdraw",
            amount,
            timestamp: this.nowISO()
          });
          await saveUser();
          return message.reply(`${this.langs.en.savingsWithdrawn}\n💰 ${this.formatMoney(amount)} moved to balance.\n💳 New Balance: ${this.formatMoney(userData.data.bank.balance)}`);
        } else {
          return message.reply("Usage:\nbank savings deposit <amount>\nbank savings withdraw <amount>");
        }
      }

      // ---------- CARD: APPLY / LIST / SHOW / BLOCK / ACTIVATE ----------
      if (action === "card") {
        const sub = (args[1] || "").toLowerCase();

        // apply new card
        if (sub === "apply") {
          const type = args[2] || "classic";
          if (userData.data.bank.cards.length >= this.SYSTEM.MAX_CARDS_PER_USER) return message.reply(`❌ Max ${this.SYSTEM.MAX_CARDS_PER_USER} cards allowed.`);
          const newCard = {
            id: `card_${Date.now().toString(36)}`,
            number: this.generateCardNumber(),
            cvv: this.generateCVV(),
            pin: this.generatePIN(),
            expiry: this.getExpiry(),
            type,
            active: false,
            createdAt: this.nowISO()
          };
          userData.data.bank.cards.push(newCard);
          await saveUser();
          return message.reply(this.langs.en.cardApplied.replace("%1", newCard.id).replace("%2", newCard.pin));
        }

        // list cards
        if (sub === "list") {
          const cards = userData.data.bank.cards || [];
          if (!cards.length) return message.reply(this.langs.en.noCard);
          let msg = `💳 YOUR CARDS\n━━━━━━━━━━━━━━━━━\n`;
          cards.forEach(c => {
            msg += `• ID: ${c.id} | ${c.type.toUpperCase()} | ${c.number.slice(0, 4)} **** **** ${c.number.slice(-4)} | ${c.active ? "ACTIVE" : "INACTIVE"}\n`;
          });
          return message.reply(msg);
        }

        // show card (image)
        if (sub === "show") {
          const id = args[2];
          if (!id) return message.reply("❌ Provide card ID.\nUse: bank card list");
          const card = findCardById(id);
          if (!card) return message.reply("❌ Card not found!");

          const file = await this.createRealCard(
            card,
            userData.name || "User",
            userData.data.bank.balance,
            userData.data.bank.transactions,
            "premium"
          );

          return message.reply({
            body: `💳 CARD PREVIEW\nID: ${id}`,
            attachment: fs.createReadStream(file)
          });
        }

        // block card
        if (sub === "block") {
          const id = args[2];
          if (!id) return message.reply("❌ Provide card ID.");

          const card = findCardById(id);
          if (!card) return message.reply("❌ Card not found!");

          card.active = false;
          await saveUser();
          return message.reply(this.langs.en.cardBlocked);
        }

        // activate card (requires PIN)
        if (sub === "activate") {
          const id = args[2];
          const pin = args[3];

          if (!id) return message.reply("❌ Provide card ID.");
          if (!pin) return message.reply("❌ Provide PIN.");
          if (pin.length !== 4 || isNaN(pin)) return message.reply(this.langs.en.invalidPin);

          const card = findCardById(id);
          if (!card) return message.reply("❌ Card not found!");

          if (pin !== card.pin) return message.reply("❌ Wrong PIN!");

          card.active = true;
          await saveUser();
          return message.reply(this.langs.en.cardActivated);
        }

        // default card command help
        return message.reply("Card commands:\nbank card apply <type>\nbank card list\nbank card show <id>\nbank card block <id>\nbank card activate <id> <pin>");
      }

      // ---------- RAW: show internal data (developer only) ----------
      if (action === "debug_bank") {
        // DO NOT expose in production; for debugging only
        return message.reply(JSON.stringify(userData.data.bank, null, 2));
      }

      // ---------- FALLBACK ----------
      return message.reply("❌ Invalid command.\nUse: bank register | balance | card | deposit | withdraw | transfer | history | statement | savings");
    } catch (err) {
      console.error("BANK MODULE ERROR:", err);
      return message.reply("✨ Error ✨\n➤ Something went wrong!\nPlease try again later.");
    }
  }
};
