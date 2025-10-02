let totalMessages = 0, messagesLimit = 0, nickColor = "user", removeSelector, addition, customNickColor, channelName,
    provider;
let animationIn = 'bounceIn';
let animationOut = 'bounceOut';
let hideAfter = 60;
let hideCommands = "no";
let ignoredUsers = [];
let previousSender = "";
let mergeMessages = false;
let visibleBadges = true;

// You can personalize the events you want to show in the chat
// The events that are not in the list or define as false for isActive will not be displayed in the chat
let eventList = [
    { libelle: "message", isActive: true },
    { libelle: "delete-message", isActive: true },
    { libelle: "delete-messages", isActive: true },
    { libelle: "follower-latest", isActive: true },
    { libelle: "raid-latest", isActive: true },
    { libelle: "subscriber-latest", isActive: true },
    { libelle: "tip-latest", isActive: true },
    { libelle: "cheer-latest", isActive: true },
    { libelle: "event", isActive: true }
];

// Create a Set with the active events
let activeEvents = new Set(
    eventList.filter(event => event.isActive).map(event => event.libelle)
);

window.addEventListener('onEventReceived', function (obj) {
    const listener = obj.detail.listener;
    const event = obj.detail.event;

    // If the event is a widget button click, we can emulate a message event
    // This is useful for testing purposes, you can remove this part if you don't need it
    if (obj.detail.event.listener === 'widget-button') {
        if (obj.detail.event.field === 'testMessage') {
            let emulated = new CustomEvent("onEventReceived", {
                detail: {
                    listener: "message",
                    event: {
                        service: "twitch",
                        data: {
                            time: Date.now(),
                            tags: {
                                "badge-info": "",
                                badges: "moderator/1,partner/1,artist/1",
                                color: "#5B99FF",
                                "display-name": "StreamElements",
                                emotes: "25:46-50",
                                flags: "",
                                id: "43285909-412c-4eee-b80d-89f72ba53142",
                                mod: "1",
                                "room-id": "85827806",
                                subscriber: "0",
                                "tmi-sent-ts": "1579444549265",
                                turbo: "0",
                                "user-id": "100135110",
                                "user-type": "mod"
                            },
                            nick: 'bob',
                            userId: "100135110",
                            displayName: 'Bob',
                            displayColor: "#5B99FF",
                            badges: [{
                                type: "moderator",
                                version: "1",
                                url: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
                                description: "Moderator"
                            }, {
                                type: "partner",
                                version: "1",
                                url: "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3",
                                description: "Verified"
                            }],
                            channel: 'Bob',
                            text: "Howdy! My name is Bob and I am here to serve Kappa",
                            isAction: !1,
                            emotes: [{
                                type: "twitch",
                                name: "Kappa",
                                id: "25",
                                gif: !1,
                                urls: {
                                    1: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0",
                                    2: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0",
                                    4: "https://static-cdn.jtvnw.net/emoticons/v1/25/3.0"
                                },
                                start: 46,
                                end: 50
                            }],
                            msgId: "43285909-412c-4eee-b80d-89f72ba53142"
                        },
                        renderedText: 'Howdy! My name is Bob and I am here to serve <img src="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0" srcset="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0 1x, https://static-cdn.jtvnw.net/emoticons/v1/25/1.0 2x, https://static-cdn.jtvnw.net/emoticons/v1/25/3.0 4x" title="Kappa" class="emote">'
                    }
                }
            });
            window.dispatchEvent(emulated);
        }
        return;
    }

    //EVENTS
    // If the listener is not in the active events, we can ignore it
    if(!activeEvents.has(listener)) return;
    // Get all important data from the event to define the message
    let eventData = {
        msgId: listener + "-" + Date.now(),
        userId: event._id,
        displayName: event.displayName,
        type: listener.replace("-latest", "")
    };
    let isEvent = false;

    // The switch case is used to define the type of event and add the necessary data
    //You can add more cases if you want to support more events
    //If you want to remove an event, just remove the case or change the isActive property to false in the eventList
    //You can also personalize the event messages displayed in the chat by changing the message variable
    switch (listener) {
        case "message":
            let data = event.data;
            if (data.text.startsWith("!") && hideCommands === "yes") break;
            if (ignoredUsers.indexOf(data.nick) !== -1) break;

            let message = attachEmotes(data);
            let badges = "", badge;
            if(visibleBadges === true){
                if (provider === 'mixer') {
                    data.badges.push({url: data.avatar});
                }
                for (let i = 0; i < data.badges.length; i++) {
                    badge = data.badges[i];
                    badges += `<img alt="" src="${badge.url}" class="badge ${badge.type}-icon"> `;
                }
            }
            let username = data.displayName + ":";
            if (nickColor === "user") {
                const color = data.displayColor !== "" ? data.displayColor : "#" + (md5(username).slice(26));
                username = `<span style="color:${color}">${username}</span>`;
            }
            else if (nickColor === "custom") {
                const color = customNickColor;
                username = `<span style="color:${color}">${username}</span>`;
            }
            else if (nickColor === "remove") {
                username = '';
            }
            addMessage(username, badges, message, data.isAction, data, isEvent);
            previousSender = data.userId;
            break
        case "follower-latest":
            isEvent = true;
            const followMessage = `✨ <b>${eventData.displayName}</b> vient de follow ! ✨`;

            addMessage('', '', followMessage, false, eventData, isEvent);
            break;
        case "raid-latest":
            Object.assign(eventData, { 
                viewers: event.amount
            });
            isEvent = true;
            const raidMessage = `🚨 <b>${eventData.displayName}</b> arrive avec un raid de ${eventData.viewers} viewers ! 🚨`;            
            
            addMessage('', '', raidMessage, false, eventData, isEvent);
            break;
        case "subscriber-latest":
            Object.assign(eventData, {
                amount: event.amount,
                gifted: event.gifted,
                bulkGifted: event.bulkGifted || false,
            });
            isEvent = true;
            let subtext = "";

            if(event.gifted === true){
                subtext += `🎉 <b>${eventData.displayName}</b> a reçu un abonnement cadeau ! 🎉`;
            }else if(eventData.bulkGifted === true){
                subtext += `🎉 <b>${eventData.displayName}</b> a offert ${eventData.amount} abonnement(s) ! 🎉`;
            }else{
                subtext += `🎉 <b>${eventData.displayName}</b> s'est abonné(e) ! 🎉`;
            }

            addMessage('', '', subtext, false, eventData, isEvent);
            break;
        case "cheer-latest":
            Object.assign(eventData, {
                amount: event.amount,
            });
            isEvent = true;
            const cheerMessage = `💰 <b>${eventData.displayName}</b> a donné ${eventData.amount} bits ! 💰`;
            
            addMessage('', '', cheerMessage, false, eventData, isEvent);
            break;
        case "tip-latest":
            Object.assign(eventData, {
                amount: event.amount,
                currency: event.currency || '€',
            });
            isEvent = true;
            const tipMessage = `💵 <b>${eventData.displayName}</b> a donné ${eventData.amount} ${eventData.currency} ! 💵`;
            
            addMessage('', '', tipMessage, false, eventData, isEvent);
            break;
        case "event":
            // This event is used to display custom events, like charity campaigns or other custom events
            let eventMessage = '';
            if(event.type === "charityCampaignDonation") {
                Object.assign(eventData, {
                    amount: event.data.amount,
                    currency: event.data.currency || '€',

                });
                isEvent = true;
                eventMessage = `❤️ <b>${event.data.displayName}</b> a fait un don de ${eventData.amount} ${eventData.currency} pour la campagne de charité ! ❤️`;
                
                addMessage('', '', eventMessage, false, eventData, isEvent);
            }
            break;
        case "delete-message":
            // This event is used to delete a specific message by its msgId
            const msgId = event.msgId;
            document.querySelectorAll(`#message-${msgId}`).forEach(el => {
                el.remove();
            });
            break;
        case "delete-messages":
            // This event is used to delete all messages from a specific user or all messages in the chat
            // If the userId is not defined, it will delete all messages in the chat
            const sender = event.userId;
            let deleteElement = ""

            if(sender === undefined || sender === null || sender === "") {
                deleteElement = `.message-row`;
            }else {
                deleteElement = `.message-row[data-sender="${sender}"]`;
            }
            document.querySelectorAll(deleteElement).forEach(el => {
                el.remove();
            });
            break;
        default:
            console.log("Unknown event: ", listener);
    }
});

window.addEventListener('onWidgetLoad', function (obj) {
    const fieldData = obj.detail.fieldData;
    animationIn = fieldData.animationIn;
    animationOut = fieldData.animationOut;
    hideAfter = fieldData.hideAfter;
    messagesLimit = fieldData.messagesLimit;
    nickColor = fieldData.nickColor;
    customNickColor = fieldData.customNickColor;
    hideCommands = fieldData.hideCommands;
    channelName = obj.detail.channel.username;
    mergeMessages = fieldData.mergeMessages === "yes";
    fetch('https://api.streamelements.com/kappa/v2/channels/' + obj.detail.channel.id + '/').then(response => response.json()).then((profile) => {
        provider = profile.provider;
    });
    if (fieldData.alignMessages === "block") {
        addition = "prepend";
        removeSelector = ".message-row:nth-child(n+" + (messagesLimit + 1) + ")"
    } else {
        addition = "append";
        removeSelector = ".message-row:nth-last-child(n+" + (messagesLimit + 1) + ")"
    }

    ignoredUsers = fieldData.ignoredUsers.toLowerCase().replace(" ", "").split(",");
});

function attachEmotes(message) {
    let text = html_encode(message.text);
    let data = message.emotes;
    if (typeof message.attachment !== "undefined") {
        if (typeof message.attachment.media !== "undefined") {
            if (typeof message.attachment.media.image !== "undefined") {
                text = `${message.text}<img src="${message.attachment.media.image.src}">`;
            }
        }
    }
    return text
        .replace(
            /([^\s]*)/gi,
            function (m, key) {
                let result = data.filter(emote => {
                    return html_encode(emote.name) === key
                });
                if (typeof result[0] !== "undefined") {
                    let url = result[0]['urls'][1];
                    if (provider === "twitch") {
                        return `<img class="emote" " src="${url}"/>`;
                    } else {
                        if (typeof result[0].coords === "undefined") {
                            result[0].coords = {x: 0, y: 0};
                        }
                        let x = parseInt(result[0].coords.x);
                        let y = parseInt(result[0].coords.y);

                        let width = "{emoteSize}px";
                        let height = "auto";

                        if (provider === "mixer") {
                            if (result[0].coords.width) {
                                width = `${result[0].coords.width}px`;
                            }
                            if (result[0].coords.height) {
                                height = `${result[0].coords.height}px`;
                            }
                        }
                        return /*html*/`<div class="emote" style="width: ${width}; height:${height}; display: inline-block; background-image: url(${url}); background-position: -${x}px -${y}px;"></div>`;
                    }
                } else return key;

            }
        );
}

function html_encode(e) {
    return e.replace(/[<>"^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });
}

// This function is used to add a message or an event to the chat
function addMessage(username = '', badges = '', message, isAction = '', data, isEvent) {
    totalMessages += 1;
    let element;
    let actionClass = "";

    if(isEvent) {
        element = $.parseHTML(/*html*/`
        <div data-sender="${data.userId}" data-msgid="${data.msgId}" class="design-case-wrapper event message-row {animationIn} animated" id="msg-${totalMessages}">
            <div class="design-case-event">
                <div class="event-case">
                    <div class="event-message" ${data.type}>${message}</div>
                </div>
            </div>
        </div>`);
    }else{
        if (isAction) {
            actionClass = "action";
        }
        if (mergeMessages && previousSender === data.userId) {
            const lastMessage = document.querySelector('.main-container').lastElementChild;
            const messageElement = document.createElement('span');
            messageElement.innerHTML = `&nbsp;${message}`; // Use `messageText` or your actual message content variable here
            messageElement.dataset.sender = data.userId;
            messageElement.dataset.msgid = data.msgId;
            lastMessage.querySelector('.user-message').appendChild(messageElement);
            return;
        }
        
        element = $.parseHTML(/*html*/`
        <div data-sender="${data.userId}" data-msgid="${data.msgId}" class="design-case-wrapper message-row {animationIn} animated ${data.badges[0].type === "broadcaster" ? "broadcaster" : data.badges[0].type === "moderator" ? "moderator" : "viewer"}" id="msg-${totalMessages}">
            <div class="user-box ${actionClass}">${badges}${username}</div>
            <div class="design-case">
                <div class="message-case">
                    <div class="user-message ${actionClass}">${message}</div>
                </div>
            </div>
            <div class="tail"></div>
            <div class="tail-shadow"></div>
        </div>`);
    }

    if (addition === "append") {
        if (hideAfter !== 999) {
            $(element).appendTo('.main-container').delay(hideAfter * 1000).queue(function () {
                $(this).removeClass(animationIn).addClass(animationOut).delay(1000).queue(function () {
                    $(this).remove()
                }).dequeue();
            });
        } else {
            $(element).appendTo('.main-container');
            console.log(getMessageTotalHeight());
        }
    } else {
        if (hideAfter !== 999) {
            $(element).prependTo('.main-container').delay(hideAfter * 1000).queue(function () {
                $(this).removeClass(animationIn).addClass(animationOut).delay(1000).queue(function () {
                    $(this).remove()
                }).dequeue();
            });
        } else {
            $(element).prependTo('.main-container');
        }
    }

    if (totalMessages > messagesLimit || getMessageTotalHeight() > $('.main-container').height()) {
        removeRow();
    }
}

function removeRow() {
    if(getMessageTotalHeight() < $('.main-container').height()){
        if (!$(removeSelector).length) {
            return;
        }
        if (animationOut !== "none" || !$(removeSelector).hasClass(animationOut)) {
            if (hideAfter !== 999) {
                $(removeSelector).dequeue();
            } else {
                $(removeSelector).addClass(animationOut).delay(1000).queue(function () {
                    $(this).remove().dequeue()
                });

            }
            return;
        }
    }
    
    $(removeSelector).animate({
        height: 0,
        opacity: 0
    }, 'slow', function () {
        $(removeSelector).remove();
    });
}

function getMessageTotalHeight() {
    let totalHeight = 0;
    $('.message-row').each(function () {
        totalHeight += $(this).outerHeight(true);
    });
    return totalHeight;
}