const { config } = global.GoatBot; const fs = require('fs-extra'); const path = require('path'); const { createCanvas, loadImage } = require('canvas');

module.exports = { config: { name: 'developer', aliases: ['dev'], version: '5.0', author: 'Saimx69x | Azad 💥', role: 0, description: { en: 'Add, remove, list developers with PNG image showing text info' }, category: 'developer', guide: { en: '{pn} [add | -a] <uid | @tag>: Add developer\n' + '{pn} [remove | -r] <uid | @tag>: Remove developer\n' + '{pn} [list | -l]: List all developers with text shown in image' } },

langs: { en: { added: '✅ | Added developer role for %1 users:\n%2', alreadyDev: '⚠️ | %1 users are already developers:\n%2', removed: '✅ | Removed developer role of %1 users:\n%2', notDev: '⚠️ | %1 users are not developers:\n%2', listDev: '👨‍💻 | List of developers (%1 total)' } },

onStart: async function({ message, args, usersData, event, getLang, role }) { const assetsDir = path.join(__dirname, 'dev_assets'); const imageDir = path.join(__dirname, 'dev_images'); fs.ensureDirSync(assetsDir); fs.ensureDirSync(imageDir);

if (!config.developer) config.developer = [];

async function generateDevImage({ uid, name = 'Unknown', status = 'Active' }) {
  const width = 600;
  const height = 200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0,0,width,height);
  grad.addColorStop(0,'#1e293b');
  grad.addColorStop(1,'#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,width,height);

  // Header
  ctx.font = 'bold 26px Sans';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(status==='Active'?'👨‍💻 Developer Added':'❌ Developer Removed', width/2, 40);

  // Name & UID
  ctx.font = '24px Sans';
  ctx.fillText(`Name: ${name}`, width/2, 100);
  ctx.fillText(`UID: ${uid}`, width/2, 140);

  // Status badge
  ctx.font = 'bold 22px Sans';
  ctx.fillStyle = status==='Active'?'#22c55e':'#ef4444';
  ctx.fillText(`Status: ${status}`, width/2, 180);

  const outPath = path.join(imageDir, `${uid}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  return outPath;
}

switch(args[0]) {
  case 'add':
  case '-a': {
    if(role<4) return message.reply('⚠️ | Only main developers can add new developers.');
    let uids = Object.keys(event.mentions);
    if(event.messageReply) uids.push(event.messageReply.senderID);
    if(!uids.length) uids = args.filter(a=>!isNaN(a));
    if(!uids.length) return message.reply('⚠️ | Enter ID or mention user');

    const notDevIds = []; const devIds = [];
    for(const uid of uids) config.developer.includes(uid)?devIds.push(uid):notDevIds.push(uid);
    config.developer.push(...notDevIds);
    fs.writeFileSync(global.client.dirConfig, JSON.stringify(config,null,2));

    await Promise.all(notDevIds.map(async uid=>{const name=await usersData.getName(uid).catch(()=>"Unknown"); return generateDevImage({uid,name,status:'Active'});}));

    return message.reply('✅ Developer(s) added and image generated.');
  }

  case 'remove':
  case '-r': {
    if(role<4) return message.reply('⚠️ | Only main developers can remove developers.');
    let uids = Object.keys(event.mentions);
    if(!uids.length) uids = args.filter(a=>!isNaN(a));
    if(!uids.length) return message.reply('⚠️ | Enter ID or mention user');

    const notDevIds=[]; const devIds=[];
    for(const uid of uids) config.developer.includes(uid)?devIds.push(uid):notDevIds.push(uid);
    for(const uid of devIds) config.developer.splice(config.developer.indexOf(uid),1);
    fs.writeFileSync(global.client.dirConfig, JSON.stringify(config,null,2));

    await Promise.all(devIds.map(async uid=>{const name=await usersData.getName(uid).catch(()=>"Unknown"); return generateDevImage({uid,name,status:'Removed'});}));

    return message.reply('✅ Developer(s) removed and image updated.');
  }

  case 'list':
  case '-l': {
    if(!config.developer.length) return message.reply('⚠️ | No developers found');
    const getNames = await Promise.all(config.developer.map(uid=>usersData.getName(uid).then(name=>({uid,name}))));
    const imgList = await Promise.all(getNames.map(async dev=>{
      const imgPath = path.join(imageDir, `${dev.uid}.png`);
      if(fs.existsSync(imgPath)) return imgPath;
      return generateDevImage({uid:dev.uid,name:dev.name,status:'Active'});
    }));

    for(const img of imgList){
      message.reply({body:'👨‍💻 Developer Info', attachment: fs.createReadStream(img)});
    }
    break;
  }

  default: return message.SyntaxError();
}

} };
