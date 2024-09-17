import { OAUTH_TOKEN, CHANNEL_NAME, CLIENT_ID, AUTHORIZATION, ID_BROADCASTER } from './constants.js'

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
  channels: [CHANNEL_NAME]
});

client.connect();

// liste des badge utilisés lors de l'affichage 
let globalBadges = []
let subscriberBadges

// apres la connection recuperation des badges 
client.on('connected', async (address, port) => {
  fetch("https://api.twitch.tv/helix/chat/badges/global", {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTHORIZATION,
      "Client-Id": CLIENT_ID
    },
  }).then(response => response.json()).then(body => globalBadges.push(...body.data))

  fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${ID_BROADCASTER}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTHORIZATION,
      "Client-Id": CLIENT_ID
    },
  }).then(response => response.json()).then(body => subscriberBadges = body.data);

})

client.on('message', (channel, tags, message, self) => {
  setMessage(tags,message)
});

client.on("cheer", (channel, userstate, message) => {
  // setMessage(userstate,message)
});

function setMessage (tags,message){
  // const color = tags['color']
  const emote = tags['emotes']
  const messageType = tags['msg-id']
  const badge = tags['badges']

  tchat.appendChild(createMessage(tags,badge,message,emote,messageType))

  const messages = document.querySelectorAll('.message')
  const messageCount = messages.length
  const maxMsg = 5
  if (messageCount > maxMsg) {
    Array.from(messages).slice(0, messageCount - maxMsg).forEach((msg) => msg.remove())
  }
}

function createMessage (tags,badge,message,emote,messageType){
  let divMessage = document.createElement('div')
  divMessage.setAttribute("class", "message"); 
  divMessage.setAttribute("id",`message-${tags['id']}`)
  divMessage.setAttribute("data-sender",`${tags['user-id']}`)

  let divMeta = document.createElement('div')
  divMeta.setAttribute("class", "meta"); 
  divMeta
  const username = document.createTextNode(`${tags['display-name']}`);
  divMeta.appendChild(username)

  let divMessageBody = document.createElement('div')
  divMessageBody.setAttribute("class", "messageBody"); 
  divMessageBody.setAttribute("id","messageBody")


  let divBadge = document.createElement('div')
  divBadge.setAttribute("class", badge == null ? "badge badgeHidden" : "badge"); 
  divBadge.setAttribute("id","badge")
  divBadge.insertAdjacentHTML('beforeend',/*html*/getBadge(badge))
  divMessageBody.appendChild(divBadge)

  let divMessageContent = document.createElement('div')
  divMessageContent.setAttribute("class", `${badge == null ? "messageContentWithoutBadge" : "messageContent"}`); 
  divMessageContent.setAttribute("id","messageContent")

  if (emote == null) {
    let content = document.createTextNode(message)
    divMessageContent.appendChild(content)
  }else{
    divMessageContent.appendChild(getMessageHTML(message, emote, messageType))
  }

  divMessageBody.appendChild(divMessageContent)

  divMessage.appendChild(divMeta)
  divMessage.appendChild(divMessageBody)

  return divMessage
}

// Methode d'ajout des emote dans le message
function getMessageHTML(message, emotes, messageType) {
  if (!emotes) return message;

  const stringReplacements = [];

  Object.entries(emotes).forEach(([id, positions]) => {
    const position = positions[0];
    const [start, end] = position.split("-");
    const stringToReplace = message.substring(
      parseInt(start, 10),
      parseInt(end, 10) + 1
    );

    if (messageType === "gigantified-emote-message") {
      // img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/3.0`
      stringReplacements.push({
        stringToReplace: stringToReplace,
        replacement: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/3.0`,
      });
    } else {
      // img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/1.0`
      stringReplacements.push({
        stringToReplace: stringToReplace,
        replacement:`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/2.0`,
      });
    }

  });

  let messageHTML = document.createElement('div')
  messageHTML.setAttribute("class","textWithEmote")

  let stringSplit = message.split(' ')
  
  let messageString = ""
  
  for(let wordIndex in stringSplit){
    let emoteName = stringReplacements.find(e => e.stringToReplace == stringSplit[wordIndex])
    if(emoteName == undefined){
      messageString += " "+stringSplit[wordIndex]
      
    }else{
      const content = document.createTextNode(messageString)
      let p = document.createElement('p')
      p.appendChild(content)
      messageHTML.appendChild(p)   
      let img = document.createElement('img')
      img.src = emoteName['replacement']
      messageHTML.appendChild(img)
      messageString = " "
    }
    
  }
  return messageHTML;
}


//methode d'ajout des badge dans le message
function getBadge(badge) {
  let message = ""
  for (let key in badge) {
    let badgeInfo = globalBadges.find(e => e.set_id == key)
    if (key === "subscriber") {
      let subscriberBadge = subscriberBadges[0]['versions'].find(b => b.id == badge['subscriber'])
      message += `<img src="${subscriberBadge['image_url_1x']}"/>`
    }else if (key === "bits-leader" || key === "sub-gift-leader"){
      message += `<img src="${badgeInfo['versions'][`${parseInt( badge[key])-1}`]['image_url_1x']}"/>`
    }
    else if (key === "sub-gifter" || key === "bits"){
      let BadgeSubGifter = badgeInfo['versions'].find(e => e.id == badge[key])
       message += `<img src="${BadgeSubGifter['image_url_1x']}"/>`
    }
    else {
      message += `<img src="${badgeInfo['versions']['0']['image_url_1x']}"/>`
    }
  }
  return message
}




  // if (emote == null) {
  //   //style="--color: ${color}"
  //   tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="message" >
  //           <div class="meta">
  //               ${tags['display-name']}
  //           </div>
  //           <div class="messageBody" id="messageBody">
  //             <div id="badge" class="badge ${badge == null ? "badgeHidden" : ""}">
  //             ${getBadge(badge)}
  //             </div>
  //             <div id="messageContent" class="${badge == null ? "messageContentWithoutBadge" : "messageContent"}">
  //               ${message}
  //             </div>
  //           </div>`)
  // } else {
  //   // ${messageType === "animated-message" ? "animatedMessage" : "message"
  //   tchat.insertAdjacentHTML('beforeend',/*html*/`<div id="message-${tags['id']}" data-sender="${tags['user-id']}" class="message">
  //           <div class="meta">
  //               ${tags['display-name']}
  //           </div>
  //           <div class="messageBody" id="messageBody">
  //             <div id="badge" class="badge ${badge == null ? "badgeHidden" : ""}">
  //               ${getBadge(badge)}  
  //             </div>
  //             <div id="messageContent" class="${badge == null ? "messageContentWithoutBadge" : "messageContent"}">
  //               ${getMessageHTML(message, emote, messageType)}
  //             </div>
  //           </div>`)
  // }
