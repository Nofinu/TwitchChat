import { OAUTH_TOKEN, CHANNEL_NAME, CLIENT_ID,AUTHORIZATION,ID_BROADCASTER } from './constants.js'


const tchat = document.querySelector('#tchat')


const client = new tmi.Client({
  options: { 
    debug: true,
    skipUpdatingEmotesets: true
   },
	connection: {
        reconnect: true,
        secure: true,
	},
	identity: {
		username: CHANNEL_NAME,
		password: OAUTH_TOKEN
	},
	channels: [ CHANNEL_NAME ]
});

client.connect();

// liste des badge utilisés lors de l'affichage 
let globalBadges= []
let subscriberBadges

// apres la connection recuperation des badges 
client.on('connected', async (address, port) => {
    fetch("https://api.twitch.tv/helix/chat/badges/global",{
      headers: {
          "Content-Type": "application/json",
           Authorization: AUTHORIZATION,
          "Client-Id" : CLIENT_ID
        },
    }).then(response => response.json()).then(body => globalBadges.push(...body.data))

    fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${ID_BROADCASTER}`,{
      headers: {
          "Content-Type": "application/json",
           Authorization: AUTHORIZATION,
          "Client-Id" : CLIENT_ID
        },
    }).then(response => response.json()).then(body => subscriberBadges = body.data );
    
  })




client.on('message', (channel, tags, message, self) => {
    const color = tags['color']
    const emote = tags['emotes']
    const messageType = tags['msg-id']
    const badge = tags['badges']

    if(emote == null){
        //style="--color: ${color}"
        tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="${messageType === "animated-message"? "animatedMessage" : "message"}" >
            <div class="meta">
            <div id="badge" class="badge">
            ${getBadge(badge)}
            </div>
                ${tags['display-name']}
            </div>
                <div id="messageContent" class="messageContent">
                    ${message}
                </div>
            </div>`)
    }else{
        tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="${messageType === "animated-message"? "animatedMessage" : "message"}">
            <div class="meta">
            <div id="badge" class="badge">
            ${getBadge(badge)}
            </div>
                ${tags['display-name']}
            </div>
                <div id="messageContent" class="messageContent">
                    ${getMessageHTML(message,emote,messageType)}
                </div>
            </div>`)
    }
    const messages = document.querySelectorAll('.message')
    const messageCount = messages.length
    const maxMsg = 10
    if(messageCount > maxMsg){
        Array.from(messages).slice(0,messageCount-maxMsg).forEach((msg) => msg.remove())
    }

});

// todo add bit message

// client.on('bits', (channel, tags, message, self) => {
// 	// "Alca: Hello, World!"
//     const color = tags['color']
//     const emote = tags['emotes']
//     console.log(emote);
//     if(emote == null){
//         tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="message" style="--color: ${color}">
//             <div class="meta">
//                 ${tags['display-name']}
//             </div>
//                 <div id="messageContent" class="messageContent">
//                     ${message}
//                 </div>
//             </div>`)
//     }else{
//         console.log("message avec emote");
        
//         tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="message" style="--color: ${color}">
//             <div class="meta">
//                 ${tags['display-name']}
//             </div>
//                 <div id="messageContent" class="messageContent">
//                     ${getMessageHTML(message,emote,tags['msg-id'])}
//                 </div>
//             </div>`)
//     }
//         console.log(tags)
      

//     const messages = document.querySelectorAll('.message')
//     const messageCount = messages.length
//     const maxMsg = 10
//     if(messageCount > maxMsg){
//         Array.from(messages).slice(0,messageCount-maxMsg).forEach((msg) => msg.remove())
//     }

// });

// Methode d'ajout des emote dans le message
function getMessageHTML(message,emotes,messageType) {
    if (!emotes) return message;
  
    const stringReplacements = [];
  
    Object.entries(emotes).forEach(([id, positions]) => {
      const position = positions[0];
      const [start, end] = position.split("-");
      const stringToReplace = message.substring(
        parseInt(start, 10),
        parseInt(end, 10) + 1
      );
  
      if(messageType  === "gigantified-emote-message"){
        stringReplacements.push({
            stringToReplace: stringToReplace,
            replacement: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/3.0">`,
          });
      }else{
        stringReplacements.push({
            stringToReplace: stringToReplace,
            replacement: `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/1.0">`,
          });
      }
   
    });
  
    const messageHTML = stringReplacements.reduce(
      (acc, { stringToReplace, replacement }) => {
        return acc.split(stringToReplace).join(replacement);
      },
      message
    );
  
    return messageHTML;
  }

  //methode d'ajout des badge dans le message
function getBadge (badge){

    let message = ""
    for(let key in badge){
      let badgeInfo = globalBadges.find(e => e.set_id == key)
      if(key === "subscriber"){
        let subscriberBadge  = subscriberBadges[0]['versions'].find(b => b.id == badge['subscriber'])
        message += `<img src="${subscriberBadge['image_url_1x']}"/>`
      }else{
         message += `<img src="${badgeInfo['versions']['0']['image_url_1x']}"/>`
      }
      
    }
    
    return message
}

