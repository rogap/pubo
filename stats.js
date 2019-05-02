/* Сбор статистики пользователей
*/



function getUsersStats(watching_guilds) {
   console.log('Начался сбор информации users...');
   const start_date = new Date();

   const object_info = {
      count: 0,
      users_list: [],
      token: dbToken,
      type: 'stats'
   }
   let all_user = 0;
   for (let [key, guild] of client.guilds) { // перебор каналов
      if (!watching_guilds[guild.id]) continue; // пропускаем guild если наблюдение за ним выключенно

      for (let [key2, user] of guild.members) { // перебор юзеров
         all_user++;
         // если пользователь уже записан то пропускать не нужно, так как нужно записывать другие его данные
         const game = user.presence.game || {name: '', type: ''};
         const mess = messCounter[user.id] || '';

         if (!object_info[user.id]) { // если пользователь не записан

            // если пользователь не проявил активности то пропускаем его
            if (!user.voiceChannelID && user.presence.status == "offline" && !game.name && !mess) continue;
            object_info.users_list.push(user.id); // добавляем в список

            object_info[user.id] = {
               online: user.presence.status,
               game_name: game.name,
               game_type: game.type,
               //joinedTimestamp: [user.joinedTimestamp], // время присоединения к серверу
               guilds_id: [guild.id],
               nickname: [user.nickname || ''], // nickname пользователя
               channel_id: [user.voiceChannelID || ''],
               channel_name: [(getChannelsById(user.voiceChannelID) || {name: ''}).name],
               mess
            }
         } else { // если пользователь уже был записан - обновляем данные
            const obj_ui = object_info[user.id];
            //obj_ui.joinedTimestamp.push(user.joinedTimestamp);
            obj_ui.guilds_id.push(guild.id);
            obj_ui.nickname.push(user.nickname || '');
            obj_ui.channel_id.push(user.voiceChannelID || '');
            obj_ui.channel_name.push((getChannelsById(user.voiceChannelID) || {name: ''}).name);
         }
         //user.user.avatar; // https://cdn.discordapp.com/avatars/ user_id / avatar_hash .png
      }
   }
   object_info.count = object_info.users_list.length;
   messCounter = {}; // обнуляем все записи о сообщениях
   const logText = `Сбор users занял: ${new Date() - start_date}мс. ` + 
   	`Всего: ${all_user}, активных: ${object_info.count}.`;
   console.log(logText);
   console.log('Отправляем данные на сервер...\n');
   return object_info;
}







function getChannelsById(id) { // получаем обьект канала по id (голосовой или текстовый)
   for (let [key3, value3] of client.channels) {
      if (key3 == id) return value3.name;
   }
   return null;
}


// делает запросы на сайт
function getSite(params, callback, func_err) {
   params.url = encodeURI(params.url); // кодируем в url
   const sendData = params.method == "POST" ? request.post : request.get;
   sendData(params, function (error, response, body){
      if (error) {
         func_err(error, params);
      } else {
         callback(response, body);
      }
   });
}


let messCounter = {} // счетчик сообщений по серверам (гильдиям)
// guildId обьект-список настроек (id серверов на которых идет запись)
function startMessageStats(guildId) { // запуск сбора статистики сообщений
	client.on('message', (mess) => {
		if (!mess.guild) return; // если смс в лс то выход
		const gID = mess.channel.guild.id;
		const aID = mess.author.id;
		if (!guildId[gID]) return; // если нет в списке или false - выход
		if (!messCounter[aID]) messCounter[aID] = {}
		if (!messCounter[aID][gID]) messCounter[aID][gID] = {count: 0}
		messCounter[aID][gID].count++;
	});
}


function startGuildUpdate() {
   client.on('guildUpdate', (oldGuild, newGuild) => { // изменения серверов
      const guildsDate = { // инфомрация об измененном сервере
         count: 1,
         guilds_list: [newGuild.id],
         token: dbToken,
         type: 'guilds'
      }
      guildsDate[newGuild.id] = {
         name: newGuild.name,
         icon: newGuild.icon,
         ownerID: newGuild.ownerID,
         createdAt: newGuild.createdAt
      }
      const start_date = new Date();
      getSite({method: "POST", url: url_site, form: guildsDate}, (res) => {
         const answerGuilds = JSON.parse(res.body);
      	let resultText = answerGuilds.status == "OK" ? 
      		`-- Type: GUILDS. Oтвет УСПЕШНО пришел за ${new Date() - start_date}мс.\n` :
      		`-- Type: GUILDS. Oтвет НЕ УДАЧНО пришел за ${new Date() - start_date}мс.\n`;
         console.log(resultText);
      });
   });
}

function startUserUpdate() {
   client.on('userUpdate', (oldUser, newUser) => { // изменения пользователей
      const usersDate = { // инфомрация об измененном пользователе
         count: 1,
         users_list: [newUser.id],
         token: dbToken,
         type: 'users'
      }
      usersDate[newUser.id] = {
         username: newUser.username,
         discriminator: newUser.discriminator,
         avatar: newUser.avatar,
         createdAt: newUser.createdAt
      }
      const start_date = new Date();
      getSite({method: "POST", url: url_site, form: usersDate}, (res) => {
      	const answerUsers = JSON.parse(res.body);
      	let resultText = answerUsers.status == "OK" ? 
      		`-- Type: USERS. Oтвет УСПЕШНО пришел за ${new Date() - start_date}мс.\n` : 
      		`-- Type: USERS. Oтвет НЕ УДАЧНО пришел за ${new Date() - start_date}мс.\n`;
         console.log(resultText);
      });
   });
}


function startGuildMemberAddAndRemove() {
	// при заходе на канал будет проверяться есть ли таблица на него уже в БД users...

   client.on('guildMemberAdd', (member) => { // guildMembersChunk когда много ?
      // при заходе на сервер по сути тоже нет смысла ибо каждые 5 мин идет запись
      console.log('вступил:');
      console.log(member.guild.id, member.guild.name);
      console.log(member.user);
   });

   client.on('guildMemberRemove', (member) => {
      // при выходе по сути нехуя делаться не будет, пока что
      console.log('покинул/кик');
      console.log(member.guild.id, member.guild.name);
      console.log(member.user);
   });
}



const request = require('request');
let client; // перенимаем глобальную функцию
let dbToken;
let url_site;
function setClient(cl, dbT, urS){
	client = cl; // устанавливаем переменную себе
	dbToken = dbT;
	url_site = urS;
	return { // то что будет возвращено экспортом в итоге
		getUsersStats,
		startGuildMemberAddAndRemove,
		startGuildUpdate,
		startUserUpdate,
		startMessageStats
		// экспортируемые функции писать СУДА!!!
	}
}

exports.stats = setClient; // экспортируем функцию которая установит глобальную переменную в этот файл








