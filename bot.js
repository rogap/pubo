const {Client} = require('discord.js')
const client = new Client()
const request = require('request')
const { createCanvas, loadImage } = require('canvas')
const Config = require('./configs.js')
const config = Config.exports || Config

config.timeStart = +new Date()
config.usedCommands = 0
config.usedCommandsNow = 0

config.timeStart = +new Date()
config.championsId = {}
config.championsName = {}
config.differentImg = []
config.LegendarChampions = {}


const paladinsItems = {
	'blast shields': null,
	'bulldozer': null,
	'cauterize': null,
	'chronos': null,
	'deft hands': null,
	'haven': null,
	'illuminate': null,
	'kill to heal': null,
	'life rip': null,
	'master riding': null,
	'morale boost': null,
	'nimble': null,
	'rejuvenate': null,
	'resilience': null,
	'veteran': null,
	'wrecker': null
}

const paladinsMaps = {
	'abyss': null,
	'abyss spire': null,
	'ascension peak': null,
	'bazaar': null,
	'brightmarsh': null,
	'dragon arena': null,
	'dragon call': null,
	'fish market': null,
	'foremans rise': null,
	'frog isle': null,
	'frozen guard': null,
	'ice mines': null,
	'jaguar falls': null,
	'magistrates archives': null,
	'marauders port': null,
	'primal court': null,
	'serpent beach': null,
	'shattered desert': null,
	'shooting range': null,
	'snowfall junction': null,
	'splitstone quarry': null,
	'stone keep': null,
	'test maps': null,
	'timber mill': null,
	'trade district': null,
	'warders gate': null
}


const BOT_TESTING = false // если true то обрабатывает только комманды создателя



/**
 * делает запрос на url с параметрами и возвращает промис с результатом
 * @param {Object} params 
 */
function sendSite(params) {
	if (!params.strictSSL) params.strictSSL = false
	params.url = encodeURI(params.url)
	const send = params.method == "POST" ? request.post : request.get
	let count = 1 // сколько раз вылезла эта ошибка

	const resend = () => {
		return new Promise((resolve, reject) => {
			send(params, function (error, response) {
				if (error) reject(error)
		      resolve(response)
			})
		}).catch(err => {
			console.log(err)
			console.log(params)
			sendError({reply:()=>{}}, JSON.stringify(params)) // отправляем ошибку в чат на сервер бота
			console.log(`Неизвестная ошибка ${count++}`)
			return resend() // повторяем запрос снова
		})
	}
	return resend()
}



const botCommands = [
	{
		commands: ["!hh"],
		info: "Выводит список команд. Если передан параметр, то выводит подсказки для указанной команды. Пример: **!hh !me**.",
		func: bot_hh,
		params: ["Команда"],
		detail: "**!hh [Команда]** - Выводит список команд. Если передан параметр, то выводит подсказки для указанной команды.\r\nПримеры:\r\n**!hh !me**, **!hh ss**, **!hh !sl**\r\nТо есть можно указывать команду (по которой хотим получить помощь) как с **!** так и без."
	},
	{
		commands: ["!me"],
		info: "Сохраняет ваш никнейм для автоматической подстановки его в другие команды (можно будет писать просто !ss или !ss me).",
		func: bot_me,
		params: ["Ник"],
		detail: "**!me [Ник]** - Сохраняет указанный никнейм либо выводит текущий сохраненный (если есть). Так же можно сохранить и ID аккаунте.\r\nПримеры:\r\n**!me mutu**, **!me 000000**\r\nСохранять свой никнейм очень выгодно, так как после можно не писать свое имя в некоторых командах, а писать **me** или даже ничего :) Примеры:\r\n**!ss** (тут ник подставится сам), **!st me винрейт** (тут вместо **me** подставится ваш ник или id).\r\n**!ss [упоминание или id дискорда]** - **!ss @Neuro** или **!ss 510112915907543042** - подставит сохраненный никнейм этих дискорд-пользователей, если конечно он у них сохранен."
	},
	{
		commands: ["!ss", "!стата"],
		info: "Выводит общую статистику аккаунта.",
		func: bot_ss,
		params: ["Ник"],
		detail: "**!ss [Ник]** - Выводит основную статистику аккаунта. Примеры:\r\n**!ss**, **!ss me**, **!ss @Neuro**, **!ss 510112915907543042**"
	},
	{
		commands: ["!sh", "!история"],
		info: "Выводит последние 50 матчей указанного игрока.",
		func: bot_sh,
		params: ["Ник", "Страница"],
		detail: "**!sh [Ник] [Страница]** - Выводит историю игр указанного пользователя. Примеры:\r\n**!sh**"
	},
	{
		commands: ["!sm", "!матч"],
		info: "Выводит подробности матча по id матча или по нику игрока.",
		func: bot_sm,
		params: ["id или Ник", "Порядок матча, если указан ник"],
		detail: ""
	},
	{
		commands: ["!sl", "!колода"],
		info: "Выводит колоды игрока указанного чемпиона.",
		func: bot_sl,
		params: ["Ник", "имя чемпиона", "номер колоды"],
		detail: ""
	},
	{
		commands: ["!sp"],
		info: "Проверяет онлайн статус игрока и выводит матч, если он в матче.",
		func: bot_sp,
		params: ["Ник"],
		detail: ""
	},
	{
		commands: ["!sc", "!чемпион"],
		info: "Выводит статистику указанного чемпиона.",
		func: bot_sc,
		params: ["Ник", "Чемпион"],
		detail: ""
	},
	{
		commands: ["!st", "!топ"],
		info: "Выводит топ чемпионов с возможностью сортировки (lvl, winrate, time, kda).",
		func: bot_st,
		params: ["Ник", "Тип сортировки"],
		detail: ""
	},
	{
		commands: ["!pal-bot", "!palbot"],
		info: "Отправляет в ЛС ссылку на сервер бота.",
		func: function(mess) {
			const text = "Группа бота: https://discord.gg/RG9WQtP"
			client.users.fetch(mess.author.id)
			.then(user => user.send(text))
		},
		detail: "**!pal-bot** - Отправляет вам в ЛС ссылку на сервер бота.\r\nМожно использовать как **!pal-bot** так и **!palbot**"
	},
	{
		commands: ["!online", "!онлайн"],
		info: "Выводит кол-во игроков онлайн в игре (данные Steam).",
		func: bot_online,
		detail: "**!online** - Парсит текущий и максимальный онлайн в игре Paladins со странички статистики стима и выводит его.\r\nМожно использовать как **!online** так и **!онлайн**"
	}
]






/**
 * ---> ФУНКЦИИ КОМАНД БОТА --->
 */


/**
 * Выводит команды бота или показывает детальную информацию для указанной команды
 * @param {*} message 
 * @param {String} command - название команды для которой нужно показать детальную инфу (не обязательно)
 */
function bot_hh(message, command='') {
	if ( !command ) {
		// если команда не передана то просто выводим список команд
		let replyText = ''
		let i = 0
		botCommands.forEach(command => {
			i++
			const funcParams = command.params ? ` [${command.params.join(', ')}]` : ''
			const twoCommand = command.commands.length > 1 ? ` Можно **${command.commands.join(', ')}**\r\n` : '\r\n'
			replyText += `${i}. **${command.commands[0]}${funcParams}** - ${command.info}${twoCommand}`
		})

		return message.reply(replyText)
	}

	// если передана команда то проверяем ее на правильность botCommands
	const find = botCommands.find( com => com.commands.find(par => par == command || par.slice(1) == command) )
	if (!find) return message.reply(`Команда **\`${command}\`** не найденна.`)

	const repText = find.detail || "Подробное описание этой команды еще не составленно, загляните в документацию на сайте, гитхабе или сервере бота."
	return message.reply(repText)
}




/**
 * Получаем или записывает никнейм пользователя по id дискорда
 * @param {*} message 
 * @param {*} name - ник или id который будет записан в БД
 */
function bot_me(message, name=null) {
	const discord_id = message.author.id
	const form = formHiRezFunc("me", discord_id, name)
	if (!name) form.form.params = null
	sendSite(form)
	.then(response => {
		const body = response.body

		// если успешно записан
		if ( body.status && name ) return message.reply("Ваш никнейм успешно записан!")

		// если никнейм был получен
		if ( body.status && !name ) {
			const res = body.result
			return message.reply(`Ваш сохраненный никнейм: **${res.hz_player_name || '-'}**, id: **${res.paladins_id || '-'}**, lang: **${res.lang}**.`)
		}

		if ( !body.status && !body.json ) return message.reply(body.err_msg || "JSON пуст, сообщите об ошибке разработчику.")

		// если нужно выбрать аккаунт
		let textReply = 'Ваш ник был сохранен, однако аккаунтов с таким ником найденно несколько - выберите аккаунт:\r\n'
		// формируем ответ
		for (let i = 0; body.json.length > i && i < 20; i++) { // а так же не больше 20
			const player = body.json[i]
			const privacy = player.privacy_flag == "n" ? "открытый" : "скрытый"
			textReply += `**${i+1}.** id: **${player.player_id}**; portal: **${player.portal_id}**; профиль: **${privacy}**;\r\n`
		}

		if ( textReply.length > 1500 ) textReply = textReply.slice(0, 1500) + '...\r\n' // обрезаем если оч длинное
		if ( body.json.length > 20 ) textReply += '__Этот список слишком велик и был обрезан.__\r\n'

		textReply += "Что бы выбрать аккаунт введите его id, пример: **!me 000000**"
		const time = body.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		textReply += `\r\nОбновленно: **${time}** (UTC+0)`
		return message.reply(textReply)
	})
}




/**
 *  --- !SS ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 */
function bot_ss(message, name) {
	const discord_id = message.author.id

	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	const form = formHiRezFunc("ss", discord_id, name)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'ss') ) return false // просто выходим, функция должна была уже отправить смс

		const getplayer = body.getplayer
		const getchampionranks = body.getchampionranks
		// проверяем есть ли ошибки в полученных данных
		try {
			if ( !getplayer.status ) return message.reply(getplayer.err_msg)
			if ( !getchampionranks.status ) return message.reply(getchampionranks.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		// если ошибок нет, то рисуем стату
		draw_ss(getplayer, getchampionranks)
		.then(ctx => {
			const buffer = ctx.canvas.toBuffer('image/png') // buffer image
			message.channel.send(`${message.author}`, {files: [buffer]})
		})
	})
}


/**
 * рисует статистику !ss
 * @param {*} getplayer 
 * @param {*} getchampionranks 
 */
function draw_ss(getplayer, getchampionranks) {
	const player = getplayer.json[0]
	const champions = getchampionranks.json

	const canvas = createCanvas(760, 330)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 16px Georgia'

	// загружаем случайный глобальный фон для статы
	const img = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	const kda = getKDABP(champions)
	let championList = []
	for (let i = 0; i < kda.best.length; i ++) {
		const champion = kda.best[i].champion
		championList.push( config.championsName[champion].loadedImg )
	}

	ctx.drawImage(img, 0, 0, 760, 300)
	const last_update_champ = getchampionranks.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
	const last_update_player = getplayer.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
	drawItems_ss(ctx, player, kda, last_update_player, last_update_champ) // рисуем эллементы не нужнающиеся в промисах

	return new Promise((resolve, reject) => {
		if (!championList.length) return reject(ctx)

		// рисуем загруженных чемпионов
		let positionX = 430
		for (let i = 0; i < championList.length; i++) {
			const img = championList[i]
			const x = positionX + 60 * i
			ctx.drawImage(img, x, 180, 50, 50)
		}

		// data загружаемой картинки ранга
		const RankedKBM = player.RankedKBM || {}
		const Tier_RankedKBM = player.Tier_RankedKBM
		const rankNum = Tier_RankedKBM == 26 && RankedKBM.Rank <= 100 && RankedKBM.Rank > 0 ? 27 : Tier_RankedKBM
		const rankUrl = rankNum ? `divisions/${rankNum}.png` : 'no-rank.png'
		const rankImgWidth = 192
		const rankImgHeight = rankNum == 0 ? 224 : rankNum == 27 ? 241 : rankNum == 26 ? 221 : 192

		loadImage(rankUrl) // загружаем картинку ранга
		.then(img => {
			ctx.drawImage(img, 5, 10, rankImgWidth / 2, rankImgHeight / 2)
			resolve(ctx)
		})
	})
}


/**
 * рисует статистику на холсте
 * @param {*} ctx 
 * @param {*} player 
 * @param {*} kda 
 */
function drawItems_ss(ctx, player, kda, last_update_player, last_update_champ) {
	const RankedKBM = player.RankedKBM || {}
	const totalTime = kda.dmg + kda.flank + kda.tank + kda.heal
	const width = 200 // отступ от картинки ранга
	const dmgDeg = 360 * (kda.dmg / totalTime)
	const flankDeg = 360 * (kda.flank / totalTime)
	const tankDeg = 360 * (kda.tank / totalTime)
	//const healDeg = 360 * (kda.heal / totalTime)

	ctx.fillStyle = "#000000"
	ctx.fillRect(0, 300, 760, 330)

	ctx.textAlign = "center"
	ctx.font = 'bold 14px Georgia' // Franklin Gothic Medium
	ctx.fillStyle = "#1199cc"
	ctx.fillText(`Аккаунт: ${last_update_player} | Чемпионы: ${last_update_champ} (UTC+0)`, 380, 320)
	ctx.font = 'bold 16px Georgia'
	ctx.fillStyle = "#dddddd"
	ctx.textAlign = "start"

	// рисуем инфу
	ctx.fillText(`${player.hz_player_name || player.hz_gamer_tag} (${player.Region})`, 10 + width / 2, 20)
	// ctx.fillText(`Клиент: ${player.Platform} - ${player.Name}`, 10 + width / 2, 40)
	ctx.fillText(`Уровень: ${player.Level}`, 10 + width / 2, 40)
	ctx.fillText(`Создан: ${getDateStats(player.Created_Datetime)}`, 10 + width / 2, 60)
	ctx.fillText(`Сыграно ${player.HoursPlayed} часов`, 10 + width / 2, 80)
	ctx.fillText(`Последний вход: ${getDateStats(player.Last_Login_Datetime)}`, 10 + width / 2, 100)
	ctx.fillText(`KDA: ${( (kda.kills + kda.assists / 2) / (kda.deaths + 1)).toFixed(2)}`, 10 + width / 2, 120)
	ctx.fillText(`Клиент: ${player.Platform} - ${player.Name}`, 10, 140)

	ctx.fillText(`ВСЕГО:`, 50, 170)
	ctx.fillText(`Убийств: ${kda.kills}`, 10, 190)
	ctx.fillText(`Смертей: ${kda.deaths}`, 10, 210)
	ctx.fillText(`Ассистов: ${kda.assists}`, 10, 230)
	ctx.fillText(`Побед: ${player.Wins}`, 10, 250)
	ctx.fillText(`Поражений: ${player.Losses}`, 10, 270)
	ctx.fillText(`Винрейт: ${fixNaN((player.Wins / (player.Wins + player.Losses) * 100).toFixed(0))}%`, 10, 290)

	ctx.fillText(`РАНКЕД:`, 250, 170)
	ctx.fillText(`Побед: ${ fixNaN(RankedKBM.Wins) }`, 200, 190)
	ctx.fillText(`Поражений: ${ fixNaN(RankedKBM.Losses) }`, 200, 210)
	const Tier_RankedKBM = player.Tier_RankedKBM
	const rankNum = Tier_RankedKBM == 26 && RankedKBM.Rank <= 100 && RankedKBM.Rank > 0 ? 27 : Tier_RankedKBM
	ctx.fillText(`Ранг: ${getRank(rankNum)}`, 200, 230)
	ctx.fillText(`ОТ: ${ fixNaN(RankedKBM.Points) }`, 200, 250)
	if (RankedKBM.Rank) ctx.fillText(`Позиция: ${ fixNaN(RankedKBM.Rank) }`, 200, 270)

	ctx.fillText("ЛЮБИМЫЕ ЧЕМПИОНЫ:", 480, 160)

	ctx.fillText("Роли:", 540, 20)
	ctx.fillText(`Урон - ${fixNaN((kda.dmg / totalTime * 100).toFixed(2))}%`, 600, 54)
	ctx.fillText(`Танк - ${fixNaN((kda.tank / totalTime * 100).toFixed(2))}%`, 600, 76)
	ctx.fillText(`Фланг - ${fixNaN((kda.flank / totalTime * 100).toFixed(2))}%`, 600, 98)
	ctx.fillText(`Хилл - ${fixNaN((kda.heal / totalTime * 100).toFixed(2))}%`, 600, 120)

	// рисуем диаграмму ->
	const second = tankDeg + dmgDeg
	const third = flankDeg + dmgDeg + tankDeg
	if (0 < dmgDeg) drawPieSlice(ctx, 510, 80, 50, 0, dmgDeg, "#9966FF")
	if (dmgDeg < second) drawPieSlice(ctx, 510, 80, 50, dmgDeg, tankDeg + dmgDeg, "#3399CC")
	if (second < third) drawPieSlice(ctx, 510, 80, 50, tankDeg + dmgDeg, flankDeg + dmgDeg + tankDeg, "#FF6600")
	if (third < 360) drawPieSlice(ctx, 510, 80, 50, flankDeg + dmgDeg + tankDeg, 360, "#33CC00")
	ctx.fillStyle = "#9966FF"
	ctx.fillRect(580, 40, 15, 15)
	ctx.fillStyle = "#3399CC"
	ctx.fillRect(580, 62, 15, 15)
	ctx.fillStyle = "#FF6600"
	ctx.fillRect(580, 84, 15, 15)
	ctx.fillStyle = "#33CC00"
	ctx.fillRect(580, 106, 15, 15)

	// любимые чемпионы ->
	ctx.fillStyle = "#009900"
	const best = kda.best
	if (best[0]) ctx.fillText(best[0].Rank, 439, 250)
	if (best[1]) ctx.fillText(best[1].Rank, 499, 250)
	if (best[2]) ctx.fillText(best[2].Rank, 559, 250)
	if (best[3]) ctx.fillText(best[3].Rank, 619, 250)
	if (best[4]) ctx.fillText(best[4].Rank, 679, 250)

	ctx.fillStyle = "#EE5500"
	if (best[0]) ctx.fillText(fixNaN(((best[0].Kills + best[0].Assists / 2) / (best[0].Deaths + 1)).toFixed(2)), 437, 270)
	if (best[1]) ctx.fillText(fixNaN(((best[1].Kills + best[1].Assists / 2) / (best[1].Deaths + 1)).toFixed(2)), 497, 270)
	if (best[2]) ctx.fillText(fixNaN(((best[2].Kills + best[2].Assists / 2) / (best[2].Deaths + 1)).toFixed(2)), 557, 270)
	if (best[3]) ctx.fillText(fixNaN(((best[3].Kills + best[3].Assists / 2) / (best[3].Deaths + 1)).toFixed(2)), 617, 270)
	if (best[4]) ctx.fillText(fixNaN(((best[4].Kills + best[4].Assists / 2) / (best[4].Deaths + 1)).toFixed(2)), 677, 270)

	ctx.fillStyle = "#0088bb"
	if (best[0]) ctx.fillText(`${getWinrate(best[0].Wins, best[0].Losses)}%`, 437, 290)
	if (best[1]) ctx.fillText(`${getWinrate(best[1].Wins, best[1].Losses)}%`, 497, 290)
	if (best[2]) ctx.fillText(`${getWinrate(best[2].Wins, best[2].Losses)}%`, 557, 290)
	if (best[3]) ctx.fillText(`${getWinrate(best[3].Wins, best[3].Losses)}%`, 617, 290)
	if (best[4]) ctx.fillText(`${getWinrate(best[4].Wins, best[4].Losses)}%`, 677, 290)
}




/**
 *  --- !SH ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 * @param {*} matchIndex - стриница истории, по десяткам (10, 20, 30, 40, 50)
 */
 function bot_sh(message, name, matchIndex=1) {
	--matchIndex
	const discord_id = message.author.id
	
	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	// если в name передан индекс
	if ( Number.isInteger(+name) && name < 6 && name != 0 ) {
		matchIndex = name
		name = discord_id
	}

	const form = formHiRezFunc("sh", discord_id, name)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'sh') ) return false // просто выходим, функция должна была уже отправить смс

		const getmatchhistory = body.getmatchhistory
		// проверяем есть ли ошибки в полученных данных
		try {
			if ( !getmatchhistory.status ) return message.reply(getmatchhistory.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		let matchList = getmatchhistory.json
		if ( matchList && matchList[0] && matchList[0].ret_msg ) return message.reply("Матчи не найденны.")
		const matchLenMax = matchList.length

		/**
		 * обрезаем матчи под указанные и проверяем хватает ли их
		 */
		const indexTo = (matchIndex + 1) * 10
		if (matchList.length > matchIndex * 10) {
			matchList = matchList.slice(matchIndex * 10, indexTo)
		} else {
			return message.reply(`Игрок **${name}** имеет **${matchList.length}** матчей, а вы указали ${indexTo}.`)
		}

		// если ошибок нет, то рисуем стату
		const last_update = getmatchhistory.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		const ctx = draw_sh(matchList, last_update)
		const buffer = ctx.canvas.toBuffer('image/png') // buffer image

		// формируем вывод списка id матчей
		let replyText = `\`\`\`md
# ID матчей (${matchLenMax}):
`
		for ( let i = 0; i < matchList.length; i++) {
			const match = matchList[i]
			replyText += `[${i + 1}](${match.Match}) `
		}

		message.channel.send(`${message.author} ${replyText}\`\`\``, {files: [buffer]})
	})
}


function draw_sh(matchList, last_update) {
	const imgWidth = 935
	const imgHeight = 580
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')

	const img = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	ctx.drawImage(img, 0, 30, imgWidth, 530)

	ctx.fillStyle = "#000000"
	ctx.fillRect(0, 0, imgWidth, 30) // прямоугольник сверху
	ctx.fillRect(0, imgHeight - 30, imgWidth, 30) // прямоугольник снизу
	ctx.fillStyle = "#dddddd"

	ctx.textAlign = "center"
	ctx.font = 'bold 14px Georgia' // Franklin Gothic Medium
	ctx.fillStyle = "#1199cc"
	ctx.fillText(`Обновленно: ${last_update} (UTC+0)`, imgWidth / 2, imgHeight - 10)
	ctx.font = 'bold 15px Georgia'
	ctx.textAlign = "start"

	drawItems_sh(ctx, matchList) // рисуем эллементы не нужнающиеся в промисах

	// получаем до 10 картинок персонажей с истории и рисуем
	const positiony = 30
	for (let i = 0; i < matchList.length; i++) {
		const item = matchList[i]
		const champion = item.Champion
		const img = config.championsName[champion].loadedImg
		const y = positiony + 52 * i
		ctx.drawImage(img, 40, y, 50, 50)
	}

	return ctx
}


function drawItems_sh(ctx, matchList) {
	const pos = [10, 100, 255, 330, 410, 505, 595, 685, 775, 865]
	ctx.fillStyle = "#1199cc"

	// рисуем таблицу для инфы
	ctx.fillText(`№`, pos[0], 20)
	ctx.fillText(`Дата/Статус`, pos[1], 20)
	ctx.fillText(`Время`, pos[2], 20)
	ctx.fillText(`Режим`, pos[3], 20)
	ctx.fillText(`У цели`, pos[4], 20)
	ctx.fillText(`КДА`, pos[5], 20)
	ctx.fillText(`Урон`, pos[6], 20)
	ctx.fillText(`Защита`, pos[7], 20)
	ctx.fillText(`Лечение`, pos[8], 20)
	ctx.fillText(`Кредиты`, pos[9], 20)

	const len = matchList.length
	for (let i = 0; i < len; i++) {
		const item = matchList[i]

		ctx.fillStyle = "#dddddd"
		ctx.fillText(`${ i + 1 }.`, pos[0], 52 * i + 60)
		ctx.fillText(`${ getDateStats(item.Match_Time) }`, pos[1], 52 * i + 48)
		ctx.fillStyle = "#0088bb"
		ctx.fillText(`${ secToMin(item.Time_In_Match_Seconds) }`, pos[2], 52 * i + 60)
		ctx.fillStyle = "#dddddd"
		ctx.fillText(`${item.Objective_Assists}`, pos[4], 52 * i + 60) // У цели
		ctx.fillStyle = "#EE5500"
		ctx.fillText(`${item.Kills}/${item.Deaths}/${item.Assists}`, pos[5], 52 * i + 60)
		ctx.fillStyle = '#BB1111' // красный
		ctx.fillText(`${item.Damage}`, pos[6], 52 * i + 60)
		ctx.fillStyle = '#CDCD11' // желтый
		ctx.fillText(`${item.Damage_Mitigated}`, pos[7], 52 * i + 60)
		ctx.fillStyle = '#32CD32' // зеленый
		ctx.fillText(`${item.Healing}`, pos[8], 52 * i + 60)
		ctx.fillStyle = "#dddddd"
		ctx.fillText(`${item.Gold}`, pos[9], 52 * i + 60)

		const getStats = item.Win_Status
		const status = getStats == "Win" ? "Победа" : getStats == "Loss" ? "Поражение" : "-"
		const statusColor = status == "Победа" ? "#32CD32" : "#BB1111"

		const getQueue = item.Queue
		const queue = getQueue == "Siege" ? "Осада" : 
			getQueue == "Siege Training" ? "Осада (Б)" : 
			getQueue == "Ranked" ? "Ранкед" : 
			getQueue == "Onslaught" ? "Натиск" : 
			getQueue == "Onslaught Training" ? "Натиск (Б)" : 
			getQueue == "Team Deathmatch" ? "Насмерть" : 
			getQueue == "Team Deathmatch Training" ? "Насмерть (Б)" : 
			getQueue == "Test Maps" ? "Тестовые" : getQueue

		ctx.fillStyle = statusColor
		ctx.fillText(`${status}`, pos[1], 52 * i + 72) // сатус
		ctx.fillStyle = "#dddddd"
		ctx.fillText(`${queue}`, pos[3], 52 * i + 60) // Режим
	}
}




/**
 *  --- !SM ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 */
function bot_sm(message, name, matchIndex=1) {
	const discord_id = message.author.id
	
	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	const form = formHiRezFunc("sm", discord_id, name, matchIndex)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'sm') ) return false // просто выходим, функция должна была уже отправить смс

		const getmatchdetails = body.getmatchdetails
		// проверяем есть ли ошибки в полученных данных
		try {
			if ( !getmatchdetails.status ) return message.reply(getmatchdetails.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		// если ошибок нет, то рисуем стату
		draw_sm(getmatchdetails.json)
		.then(ctx => {
			const buffer = ctx.canvas.toBuffer('image/png') // buffer image
			message.channel.send(`${message.author}`, {files: [buffer]})
		})

	})
}


function draw_sm(matchdetails) {
	const imgWidth = 1225
	const imgHeight = 795
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 15px Georgia'
	ctx.fillStyle = "#ffffff"

	const background = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	ctx.drawImage(background, 0, 0, imgWidth, imgHeight)
	const matchOne = matchdetails[0] // просто выбранный первый человек в матче для получения статы самого матча

	// инфа по центру
	let mapImg = null // узнаем карту, получаем ее картинку
	let mapName = ''
	for (let map in paladinsMaps) {
		const reg = new RegExp(`${map}`, 'i')
		const res = matchOne.Map_Game.replace(/'/,'').match(reg)
		if (res) {
			mapImg = paladinsMaps[map]
			mapName = res[0]
			break
		}
	}
	if (!mapName) {
		mapName = matchOne.Map_Game || 'test'
		mapImg = paladinsMaps['test maps']
	}
	if (mapImg) ctx.drawImage(mapImg, 10, 315, 356, 200) // рисуем карту
	ctx.font = 'bold 20px Georgia'
	ctx.fillText(matchOne.Entry_Datetime, 20, 502)

	const typeMatch = matchOne.name
	ctx.fillStyle = "#cccc11"
	ctx.fillText(`${matchOne.Minutes} минут`, 376, 375)
	ctx.fillText(`Регион: ${matchOne.Region}`, 376, 405)
	ctx.fillText(typeMatch, 376, 435)
	ctx.fillText(mapName, 376, 465)

	ctx.textAlign = "center"
	const winStatus = matchOne.Win_Status == 'Winner'
	const centerGoRight = typeMatch == 'Ranked' ? 0 : 190
	if (winStatus) {
		ctx.fillStyle = '#32CD32'
		ctx.fillText('Победа', imgWidth / 2 + 70 + centerGoRight, 341)
		ctx.fillStyle = '#BB1111'
		ctx.fillText('Поражение', imgWidth / 2 + 70 + centerGoRight, 497)

		ctx.fillStyle = 'rgba(50,205,50,0.06)'
		ctx.fillRect(0, 30, imgWidth, 285)
		ctx.fillStyle = 'rgba(187,17,17,0.1)'
		ctx.fillRect(0, 515, imgWidth, 285)
	} else { // эта часть не нужна походу так как победителя всегда перемещаются вверх
		ctx.fillStyle = '#BB1111'
		ctx.fillText('Поражение', imgWidth / 2 + 70 + centerGoRight, 341)
		ctx.fillStyle = '#32CD32'
		ctx.fillText('Победа', imgWidth / 2 + 70 + centerGoRight, 497)

		ctx.fillStyle = 'rgba(187,17,17,0.1)'
		ctx.fillRect(0, 30, imgWidth, 285)
		ctx.fillStyle = 'rgba(50,205,50,0.06)'
		ctx.fillRect(0, 515, imgWidth, 285)
	}

	ctx.fillStyle = "#ffffff"
	ctx.fillText(`Команда 1 Счет: ${matchOne.Team1Score}`, imgWidth / 2 + 70 + centerGoRight, 383)
	ctx.fillText(`Команда 2 Счет: ${matchOne.Team2Score}`, imgWidth / 2 + 70 + centerGoRight, 456)
	ctx.drawImage(config.differentImg.vs, imgWidth / 2 + 40 + centerGoRight, 386, 50, 50)

	ctx.textAlign = "start"
	ctx.fillStyle = '#EE5500'
	if (typeMatch == 'Ranked') ctx.fillText(`Баны:`, 885, 420)
	ctx.fillStyle = "#ffffff"
	ctx.font = 'bold 15px Georgia'
	if (matchOne.Ban_1)ctx.drawImage(config.championsName[matchOne.Ban_1].loadedImg, 980, 360, 50, 50)
	if (matchOne.Ban_2)ctx.drawImage(config.championsName[matchOne.Ban_2].loadedImg, 1040, 360, 50, 50)
	if (matchOne.Ban_3)ctx.drawImage(config.championsName[matchOne.Ban_3].loadedImg, 980, 420, 50, 50)
	if (matchOne.Ban_4)ctx.drawImage(config.championsName[matchOne.Ban_4].loadedImg, 1040, 420, 50, 50)

	// рисуем таблицу
	ctx.fillStyle = "#000000"
	ctx.fillRect(0, 0, imgWidth, 32)
	ctx.fillStyle = "#1199cc"
	ctx.fillText('Чемпион', 10, 20)
	ctx.fillText('Игрок / ОТ', 140, 20)
	ctx.fillText('Пати', 365, 20)
	ctx.fillText('Кредиты', 420, 20)
	ctx.fillText('K/D/A', 505, 20)
	ctx.fillText('Урон', 585, 20)
	ctx.fillText('Защита', 670, 20)
	ctx.fillText('Лечение', 765, 20)
	ctx.fillText('Получено', 860, 20)
	ctx.fillText('Цель', 960, 20)
	ctx.fillText('Закуп', 1025, 20)
	ctx.fillStyle = "#ffffff"

	const party = {}
	let partyNumber = 1
	const partyColors = ['#00FFFF', '#006400', '#F08080', '#FFFF00', '#FF0000', '#4682B4', '#C71585', '#FF4500', '#7FFF00'].sort(function() {
		return Math.random() - 0.5 // рандомизируем цвета каждый раз
	})

	for (let i = 0; i < matchdetails.length; i++) {
		const players = matchdetails[i]
		//const champName = config.championsCard[players.ChampionId][0].champion_name
		const champName = players.Reference_Name

		const cnampion = config.championsName[champName]
		let nextTeam = i >= 5 ? 245 : 40
		if (cnampion) { // если есть чемпион то рисуем
			const img = cnampion.loadedImg
			ctx.drawImage(img, 10, 55 * i + nextTeam, 50, 50) // рисуем иконки чемпионов
		}

		const imgLegendary = config.LegendarChampions[players.ItemId6]
		if (imgLegendary) ctx.drawImage(imgLegendary, 65, 55 * i + nextTeam, 50, 50) // рисуем легендарки

		ctx.drawImage(config.rankedImage[players.League_Tier], 115, 55 * i + nextTeam, 50, 50) // рисуем ранг

		// рисуем закуп
		const item1 = players.Item_Active_1
		if (item1) {
			ctx.drawImage(paladinsItems[item1.toLowerCase()], 1025, 55 * i + nextTeam, 40, 40)
			drawLevelItem(ctx, players.ActiveLevel1, 1025, 55 * i + nextTeam + 43, 10, 3)
		}
		const item2 = players.Item_Active_2
		if (item2) {
			ctx.drawImage(paladinsItems[item2.toLowerCase()], 1075, 55 * i + nextTeam, 40, 40)
			drawLevelItem(ctx, players.ActiveLevel2, 1075, 55 * i + nextTeam + 43, 10, 3)
		}
		const item3 = players.Item_Active_3
		if (item3) {
			ctx.drawImage(paladinsItems[item3.toLowerCase()], 1125, 55 * i + nextTeam, 40, 40)
			drawLevelItem(ctx, players.ActiveLevel3, 1125, 55 * i + nextTeam + 43, 10, 3)
		}
		const item4 = players.Item_Active_4
		if (item4) {
			ctx.drawImage(paladinsItems[item4.toLowerCase()], 1175, 55 * i + nextTeam, 40, 40)
			drawLevelItem(ctx, players.ActiveLevel4, 1175, 55 * i + nextTeam + 43, 10, 3)
		}

		const partyId = players.PartyId
		let partyNum = party[partyId]
		if (!partyNum) {
			party[partyId] = partyNum = partyNumber
			partyNumber++
		}

		// ОТ ЛВЛ и ник
		ctx.fillText(players.League_Points || '', 170, 55 * i + nextTeam + 27)
		ctx.fillText(players.playerName, 205, 55 * i + nextTeam + 15)
		ctx.fillStyle = "#EE5500"
		ctx.fillText(`lvl: ${players.Account_Level}`, 205, 55 * i + nextTeam + 40)

		nextTeam += 25

		ctx.fillStyle = partyColors[partyNum - 1]
		ctx.beginPath()
		ctx.arc(385, 55 * i + nextTeam - 2, 15, 0, 2*Math.PI, false) // круг пати
		ctx.fill()
		ctx.fillStyle = "#000000"
		ctx.fillText(partyNum, 381, 55 * i + nextTeam) // цифра пати
		ctx.fillStyle = "#ffffff"
		ctx.fillText(players.Gold_Earned, 420, 55 * i + nextTeam)
		ctx.fillStyle = "#EE5500"
		ctx.fillText(`${players.Kills_Player}/${players.Deaths}/${players.Assists}`, 505, 55 * i + nextTeam)
		ctx.fillStyle = "#ffffff"
		ctx.fillText(players.Damage_Player, 585, 55 * i + nextTeam)
		ctx.fillText(players.Damage_Mitigated, 670, 55 * i + nextTeam)
		ctx.fillText(players.Healing, 765, 55 * i + nextTeam)
		ctx.fillText(players.Damage_Taken, 860, 55 * i + nextTeam)
		ctx.fillText(players.Objective_Assists, 960, 55 * i + nextTeam)
	}
	return new Promise(resolve => resolve(ctx))
}

function drawLevelItem(ctx, lvl, x, y) { // рисует полоски под закупом (их лвл)
	for (let i = 0; i <= lvl; i++) {
		ctx.fillRect(x + 14 * i, y, 10, 3)
	}
}




/**
 *  --- !SL ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 */
function bot_sl(message, name, championName, num=false) {
	if (!name && !championName) return message.reply("Укажите параметры правильно. **!sl [name] [champion]**")
	
	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	// проверяем задал ли он ник чемпиона пропустив свой ник
	const checkForNum = /^\d{0,1}$/.test(championName)
	const champion = !championName || checkForNum ? config.championsName[name] : config.championsName[championName]
	if (!champion) return message.reply("Введите корректное имя чемпиона. **!sl [name] [champion]**")
	const userName = !championName || checkForNum ? 'me' : name // если не задал свой ник
	if (checkForNum) num = championName

	const discord_id = message.author.id
	const form = formHiRezFunc("sl", discord_id, userName, 11) // id чемпиона передавать не нужно (можно передать lang)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'sl') ) return false // просто выходим, функция должна была уже отправить смс

		const getplayerloadouts = body.getplayerloadouts
		// проверяем есть ли ошибки в полученных данных
		try {
			if ( !getplayerloadouts.status ) return message.reply(getplayerloadouts.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		/**
		 * формируем колоды, преверив есть ли они вообще
		 * и предоставляем выбор колоды если их больше 1
		 */
		const loadoutsList = [] // суда запишем нужные нам колоды
		if ( !getplayerloadouts.json ) return message.reply(`Теоретически такая ошибка быть не должна, но все же -_-`)
		getplayerloadouts.json.forEach(loadouts => { // перебор колод
			if ( loadouts.ChampionId != champion.id ) return false // пропускаем не нужных чемпионов
			loadoutsList.push(loadouts)
		})

		const len = loadoutsList.length
		if ( !len ) return message.reply(`Колоды не обнаруженны.`)
		if ( len < num ) return message.reply(`Игрок не имеет столько колод, укажите правильное число, у него **${len}** колод.`)
		if ( !num && len > 1) { // если колода не указанна и колод больше 1 то выводим их список
			let repText = 'Выберите одну из колод:\r\n'
			for (let i = 0; i < len; i++) {
				loadouts = loadoutsList[i]
				repText += `**№ ${i+1}**; Имя колоды: **${loadouts.DeckName}**;\r\n`
			}
			repText += "Что бы выбрать нужную колоду допишите ее номер после имени чемпиона. **!sl [name] [champion] [index]**"
			const time = getplayerloadouts.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
			repText += `\r\nОбновленно: **${time}** (UTC+0)`
			return message.reply(repText)
		}

		// если ошибок нет, то рисуем стату
		if ( !num ) num = 1
		draw_sl( loadoutsList[--num] )
		.then(ctx => {
			const buffer = ctx.canvas.toBuffer('image/png') // buffer image
			message.channel.send(`${message.author}`, {files: [buffer]})
		})
	})
}


/**
 * 
 * @param {Object} loadouts - колода которую будем рисовать
 */
function draw_sl(loadouts) {
	const imgWidth = 1648
	const imgHeight = 600
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 15px Georgia'
	ctx.fillStyle = "#ffffff"
	ctx.textAlign = "center"

	const background = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	ctx.drawImage(background, 0, 0, imgWidth, imgHeight)

	let loadList = [] // тут будет картинки
	let listDeck = [] // тут будут свойства для картинки
	let listDescription = [] // тут будут описания карт

	const championId = loadouts.ChampionId
	loadouts.LoadoutItems.forEach(cardEl => {
		const card = getPaladinsCard(cardEl.ItemId, championId)
		loadList.push( loadImage(card.url).catch(console.log) )
		listDeck.push( {deckName: loadouts.DeckName, points: cardEl.Points} )
		listDescription.push( card.description )
	})

	return new Promise(resolve => {
		Promise.all(loadList)
		.then(imgListLoad => {
			for (let i = 0; i < imgListLoad.length; i++) { // перебор загруженных картинок
				const img = imgListLoad[i] // загруженная картинка карты
				const properties = listDeck[i] // свойства картинки (имя и на скок вкачано)

				if (img) ctx.drawImage(img, i * (10 + 314) + 48, 150, 256, 196) // рисуем картинки карт
				// теперь нужно нарисовать фреймы для карт
				const points = properties.points
				const imgFrames = config.cardFrames[points - 1] // получаем картинку фрейма карты
				ctx.drawImage(imgFrames, i * (10 + 314) + 20, 100, 314, 479)

				// рисуем название колоды
				ctx.font = 'bold 50px Georgia'
				ctx.fillStyle = "#ffffff"
				ctx.fillText(properties.deckName, imgWidth / 2, 70)

				// рисуем описание карты
				fillDescriptionCard(ctx, listDescription[i], i, points)
			}

			return resolve(ctx)
		})
	})
}

function fillDescriptionCard(ctx, text, position, points) { // рисует описание карты
	ctx.font = 'bold 16px Georgia'
	ctx.fillStyle = '#000000'

	text = text.replace(/^\[[а-я -]+\] /i, '') // убираем принадлежность (то что в [...])

	// убираем "scale" и считаем нужную цифру подставляя в текст
	const matchArr = text.match(/\{scale ?= ?([0-9\.]+)\|(-?[0-9\.]+)\}/i)
	if (!matchArr) return console.log(`Ошибка fillDescriptionCard: `, text)

	// const scaleText = (matchArr[1] * points).toFixed(1)
	let scaleText = +matchArr[1]
	for (let i = 1; i < points; i++) {
		scaleText += +matchArr[2]
	}

	// фиксим до 2 точек и если 2 нуля в конце то убираем их
	scaleText = scaleText.toFixed(2)
	if (scaleText.slice(-2) == "00") scaleText = scaleText.slice(0,-3)
	text = text.replace(/\{scale=[0-9\.]+\|-?[0-9\.]+\}/i, scaleText)

	// сначала разбиваем текст строки на нужное кол-во строк и узнаем сколько это строк
	const textArr = formProposals(text, 23)
	for (let i = 0; i < textArr.length; i++) {
		ctx.fillText(textArr[i], position * (10 + 314) + 178, 20 * i + 410)
	}
}

// возвращает url и описание карты по id чемпиона и id карты
function getPaladinsCard(idCard, idChamp) {
	const champCards = config.championsCard[idChamp]

	for (let i = 0; i < champCards.length; i++) {
		const card = champCards[i]
		if (card.card_id2 == idCard) return {
			url: card.championCard_URL,
			description: card.card_description,
			name: card.card_name
		}
	}
}




/**
 *  --- !SP ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 */
function bot_sp(message, name) {
	const discord_id = message.author.id
	
	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	const form = formHiRezFunc("sp", discord_id, name)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'sp') ) return false // просто выходим, функция должна была уже отправить смс

		const getplayerstatus = body.getplayerstatus
		// проверяем есть ли ошибки в полученных данных
		if ( !getplayerstatus.status ) return message.reply(getplayerstatus.err_msg)
		const json = getplayerstatus.json[0]

		let statusMess
		switch ( json.status ) {
			case 0:
				statusMess = `Игрок Offline.`
				break

			case 1:
				statusMess = `Игрок в меню игры.`
				break

			case 2:
				statusMess = `Игрок выбирает чемпиона.`
				break

			case 4:
				statusMess = `Игрок Online, но блокирует трансляцию состояния игрока.`
				break

			case 5:
				statusMess = `Игрок не найден.`
				break
		}

		// если статус найден то выводим его
		if (statusMess) return message.reply(statusMess)

		// теоретически такого быть не должно, но все же воизбежании ошибок...
		const getmatchplayerdetails = body.getmatchplayerdetails
		if ( json.status != 3 || !getmatchplayerdetails ) return message.reply(`Непредвиденная ошибка, сообщите о ней разработчику.`)

		// если игрок в матче то проверяем корректность данных
		try {
			if ( !getmatchplayerdetails.status ) return message.reply(getmatchplayerdetails.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлять в логи на серв
		}

		const matchplayerdetails = getmatchplayerdetails.json
		if ( !matchplayerdetails ) return message.reply("Возникла ошибка, сообщите о ней разработчикам бота: matchplayerdetails пуст.")
		if ( typeof(matchplayerdetails[0].ret_msg) == "string" ) {
			console.log(matchplayerdetails) // потом убрать консоль и сделат ьв одну строку, это нужно чекнуть удет с играми с боатми и кастомки
			return message.reply("Игрок в матче с ботами или в пользовательских играх.")
		}

		const mapName = matchplayerdetails[0].mapGame || 'Test Maps'
		let background
		if (mapName) {
			try {
				const tempMapName = mapName.replace(/live/i, '').replace(/'/i, '').replace(/\(KOTH\)/i, '').replace(/ranked/i, '').replace(/\(TDM\)/i, '').replace(/Local/i, '').trim()
				if (tempMapName.toLowerCase() == 'shooting range') return message.reply("Игрок находится в стрельбище.")
				background = paladinsMaps[tempMapName.toLowerCase()]
			} catch(e) {
				console.log(`\r\nКарта ${mapName} не найдена 1. Ошибка:`)
				console.log(e)
				// нужно будет норм сообщить об ошибке (в логи)
			}
		}

		// если ошибок нет, то рисуем стату
		const ctx = draw_sp( matchplayerdetails, background )
		// .then(ctx => {
			const buffer = ctx.canvas.toBuffer('image/png') // buffer image
			message.channel.send(`${message.author}`, {files: [buffer]})
		// })
	})
}


function draw_sp(matchplayerdetails, background) {
	matchplayerdetails.sort((a, b) => {return a.taskForce - b.taskForce}) // сортируем по командам

	const imgWidth = 952
	const imgHeight = 535
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 16px Georgia'

	const game = matchplayerdetails[0] // для удобства взятия игровой инфы
	const mapName = game.mapGame || 'Test Maps'

	try {
		ctx.drawImage(background, 0, 0, imgWidth, imgHeight)
	} catch(e) {
		console.log(`\r\nКарта ${mapName} не найдена 2. Ошибка:`)
		console.log(e)
		// нужно будет норм сообщить об ошибке (в логи)
	}

	ctx.fillRect(0, 0, imgWidth, 40)
	ctx.fillRect(0, imgHeight - 40, imgWidth, imgHeight)

	ctx.fillStyle = "#0088bb"
	ctx.fillText('Команда 1', 35, 25)
	ctx.textAlign = 'end'
	ctx.fillText('Команда 2', imgWidth - 35, 25)
	ctx.fillText(`Карта: `, imgWidth / 4, imgHeight - 15)
	ctx.fillText(`Регион: `, imgWidth / 4 + imgWidth / 2, imgHeight - 15)
	ctx.fillText(`id матча: `, imgWidth / 2, 25)
	ctx.textAlign = 'start'
	ctx.fillStyle = "#EE5500"
	ctx.fillText(` ${mapName}`, imgWidth / 4, imgHeight - 15)
	ctx.fillText(` ${game.playerRegion}`, imgWidth / 4 + imgWidth / 2, imgHeight - 15)
	ctx.fillText(` ${game.Match}`, imgWidth / 2, 25)
	ctx.fillStyle = '#ffffff'

	// перебираем игроков матча и рисуем их инфу
	for (let i = 0; i < matchplayerdetails.length; i++) {
		const item = matchplayerdetails[i]
		const champion = config.championsName[item.ChampionName] || {} // избегаем возможных ошибок
		const img = champion.loadedImg
		const tier = item.Tier

		if (item.taskForce == 1) {
			if (img) ctx.drawImage(img, 70, 90 * i + 50, 50, 50)
			// ctx.fillStyle = '#EE5500' // оранжевый
			ctx.fillText(`Ник: ${item.playerName}`, 130, 90 * i + 65)
			const winrate = fixNaN((item.tierWins / (item.tierWins + item.tierLosses) * 100).toFixed(2))
			// ctx.fillStyle = '#32CD32' // зеленый
			// рисуем винрейт только в рейте, так как он доступен только там
			if (item.Queue == 486) ctx.fillText(`Винрейт: ${winrate}%`, 130, 90 * i + 93)
			// ctx.fillStyle = '#BB1111' // красный
			ctx.fillText(`Лвл: ${item.Account_Level}`, 130, 90 * i + 120)
			ctx.textAlign = 'center'
			ctx.fillText(item.ChampionLevel, 95, 90 * i + 120)
			ctx.textAlign = 'start'

			if (tier == undefined) continue
			const imgRank = config.rankedImage[tier] // получаем картинку ранга
			const coefficient = tier == 27 ? 1.257 : tier == 26 ? 1.151 : tier == 0 ? 1.2 :1
			ctx.drawImage(imgRank, 10, 90 * i + 50, 50, 50 * coefficient)
		} else if (item.taskForce == 2) {
			if (img) ctx.drawImage(img, imgWidth - 120, 90 * (i - 5) + 50, 50, 50)
			ctx.textAlign = 'end'
			// ctx.fillStyle = '#EE5500' // оранжевый
			ctx.fillText(`Ник: ${item.playerName}`, imgWidth - 130, 90 * (i - 5) + 65)
			const winrate = fixNaN((item.tierWins / (item.tierWins + item.tierLosses) * 100).toFixed(2))
			// ctx.fillStyle = '#32CD32' // зеленый
			// рисуем винрейт только в рейте, так как он доступен только там
			if (item.Queue == 486) ctx.fillText(`Винрейт: ${winrate}%`, imgWidth - 130, 90 * (i - 5) + 93)
			// ctx.fillStyle = '#BB1111' // красный
			ctx.fillText(`Лвл: ${item.Account_Level}`, imgWidth - 130, 90 * (i - 5) + 120)
			ctx.textAlign = 'center'
			ctx.fillText(item.ChampionLevel, imgWidth - 95, 90 * (i - 5) + 120)

			if (tier == undefined) continue
			const imgRank = config.rankedImage[tier] // получаем картинку ранга
			const coefficient = tier == 27 ? 1.257 : tier == 26 ? 1.151 : tier == 0 ? 1.2 :1
			ctx.drawImage(imgRank, imgWidth - 60, 90 * (i - 5) + 50, 50, 50 * coefficient)
		}
	}

	const vs = config.differentImg.vs
	ctx.drawImage(vs, imgWidth / 2 - 70, imgHeight / 2 - 70, 140, 140)

	return ctx
}




/**
 *  --- !SC ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 */
function bot_sc(message, name, championName) {
	if (!name && !championName) return message.reply("Укажите параметры правильно. **!sc [name] [champion]**")

	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	// проверяем задал ли он ник чемпиона пропустив свой ник
	const champion = !championName ? config.championsName[name] : config.championsName[championName]
	if (!champion) return message.reply("Введите корректное имя чемпиона. **!sc [name] [champion]**")
	const userName = !championName ? 'me' : name // если не задал свой ник

	const discord_id = message.author.id
	const form = formHiRezFunc("sc", discord_id, userName)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'sc') ) return false // просто выходим, функция должна была уже отправить смс

		// проверяем есть ли ошибки в полученных данных
		const getchampionranks = body.getchampionranks
		try {
			if ( !getchampionranks.status ) return message.reply(getchampionranks.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		const champions = getchampionranks.json
		const time = getchampionranks.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		if ( !champions ) return message.reply(`Чемпионы не найденны.\r\nОбновленно: **${time}** (UTC+0)`)

		// ищем чемпиона
		const searchChampionName = champion.Name_English
		const searches = champions.find( champion => champion.champion == searchChampionName )
		if ( !searches ) return message.reply(`У игрока нет игр на **${championName || name}**.`)

		// если ошибок нет, то рисуем стату
		const ctx = draw_sc( searches, getchampionranks.id, `Обновленно: ${time} (UTC+0)` )
		const buffer = ctx.canvas.toBuffer('image/png') // buffer image
		message.channel.send(`${message.author}`, {files: [buffer]})
	})
}


function draw_sc(champion, playerId, updateTimeText) {
	const fullInfoChampion = config.championsId[ champion.champion_id ]

	const imgWidth = 600
	const imgHeight = 290
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 16px Georgia'

	const background = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	ctx.drawImage(background, 0, 0, imgWidth, imgHeight - 30)
	ctx.fillStyle = "#000000"
	ctx.fillRect(0, imgHeight - 30, imgWidth, 30)
	ctx.fillStyle = "#1199cc" // голубой
	ctx.textAlign = "center"
	ctx.fillText(updateTimeText, imgWidth / 2, imgHeight - 10)
	ctx.textAlign = "start"
	ctx.fillStyle = "#ffffff"

	ctx.fillText(`Роль: ${fullInfoChampion.Roles}`, 200, 230)
	ctx.fillText(`Титул: ${fullInfoChampion.Title}`, 200, 250)
	ctx.fillText(`Последняя игра: ${champion.LastPlayed}`, 200, 40 + 5)
	ctx.fillText(`Сыграно минут: ${champion.Minutes}`, 200, 60 + 5)

	const img = config.championsName[ champion.champion ].loadedImg
	ctx.drawImage(img, 10, 30, 180, 180)
	ctx.fillStyle = '#32CD32' // зеленый
	ctx.fillText(`Жизни: ${fullInfoChampion.Health}`, 10, 230)
	const kills = champion.Kills
	ctx.fillText(`Убийства: ${kills}`, 200, 120 + 5)
	ctx.fillText(`Победы: ${champion.Wins}`, 400, 120 + 5)

	ctx.fillStyle = "#1199cc" // голубой
	ctx.fillText(`Скорость: ${fullInfoChampion.Speed}`, 10, 250)
	const assists = champion.Assists
	ctx.fillText(`Помощи: ${assists}`, 200, 160 + 5)

	const deaths = champion.Deaths
	ctx.fillStyle = '#BB1111' // красный
	ctx.fillText(`Смерти: ${deaths}`, 200, 140 + 5)
	ctx.fillText(`Поражения: ${champion.Losses}`, 400, 140 + 5)

	const kda = ((kills + assists / 2) / (deaths + 1)).toFixed(2)
	const winrate = fixNaN((champion.Wins / (champion.Wins + champion.Losses) * 100).toFixed(0))

	ctx.fillStyle = '#EE5500' // оранжевый
	ctx.textAlign = "center"
	ctx.fillText(fullInfoChampion.Name, 100, 20)
	ctx.textAlign = "start"
	ctx.fillText(`ID игрока: ${playerId}`, 250, 20)
	ctx.fillText(`Уровень: ${champion.Rank}`, 200, 80 + 5)
	ctx.fillText(`КДА: ${kda}`, 200, 180 + 5)
	ctx.fillText(`Винрейт: ${winrate}%`, 400, 160 + 5)

	return ctx
}




/**
 *  --- !ST ---
 * получает данные и обрабатывает ошибки
 * рисует и отправляет стату
 * @param {*} message 
 * @param {*} name 
 * @param {*} typeSort - тип сортировки
 */
function bot_st(message, name, typeSort="lvl") {
	const discord_id = message.author.id
	
	// если указан пользователь, то берем его ID
	if ( /^\<\@\!?\d+\>$/.test(name) ) name = name.replace(/\D+/g, '')

	const form = formHiRezFunc("st", discord_id, name)
	sendSite(form)
	.then(response => {
		const body = response.body

		if ( !checkSelectPlayer(message, body, 'st') ) return false // просто выходим, функция должна была уже отправить смс

		// проверяем есть ли ошибки в полученных данных
		const getchampionranks = body.getchampionranks
		try {
			if ( !getchampionranks.status ) return message.reply(getchampionranks.err_msg)
		} catch(e) {
			return message.reply("Произошла ошибка, попробуйте повторить или сообщите разработчику.")
			// нужно будет отправлят ьв логи на серв
		}

		const champions = getchampionranks.json
		const time = getchampionranks.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		if ( !champions ) return message.reply(`Чемпионы не найденны.\r\nОбновленно: **${time}** (UTC+0)`)

		// получаем функцию сортировки
		let sortFunc
		switch (typeSort) {
			case "лвл":
			case "lvl":
				sortFunc = (a,b) => b.Rank - a.Rank
				break

			case "время":
			case "time":
				sortFunc = (a,b) => b.Minutes - a.Minutes
				break

			case "кда":
			case "kda":
				sortFunc = (a,b) => {
					const a_kda = ((a.Kills + a.Assists / 2) / (a.Deaths + 1)).toFixed(2)
					const b_kda = ((b.Kills + b.Assists / 2) / (b.Deaths + 1)).toFixed(2)
					return b_kda - a_kda
				}
				break

			case "винрейт":
			case "winrate":
				sortFunc = (a,b) => {
					const a_win = fixNaN((a.Wins / (a.Wins + a.Losses) * 100).toFixed(0))
					const b_win = fixNaN((b.Wins / (b.Wins + b.Losses) * 100).toFixed(0))
					return b_win - a_win
				}
				break

			default:
				sortFunc = (a,b) => b.Rank - a.Rank
				break
		}

		// сортируем чемпионов
		const sortChampions = champions.sort(sortFunc)

		// если ошибок нет, то рисуем стату
		const last_update = getchampionranks.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		const ctx = draw_st( sortChampions, last_update )
		const buffer = ctx.canvas.toBuffer('image/png') // buffer image
		message.channel.send(`${message.author}`, {files: [buffer]})
	})
}


function draw_st(champions, last_update) {
	const imgWidth = 840
	const len = champions.length
	const imgHeight = 22 * len / 2 + 85
	const paddingLeft = 420 // отступ до второй колонки
	const canvas = createCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	ctx.font = 'bold 16px Georgia'

	const background = config.imgBackground[ Math.floor(Math.random() * 3) ] // случайный фон
	ctx.drawImage(background, 0, 0, imgWidth, imgHeight - 30)

	ctx.fillStyle = "#000000"
	ctx.fillRect(0, 0, imgWidth, 30)
	ctx.fillRect(0, imgHeight - 30, imgWidth, 30)
	ctx.fillStyle = "#1199cc" // голубой
	ctx.fillRect(paddingLeft - 2, 30, 2, imgHeight - 60)
	ctx.textAlign = "center"
	ctx.fillText(`Обновленно: ${last_update} (UTC+0)`, imgWidth / 2, imgHeight - 10)
	ctx.textAlign = "start"

	for (let i = 0; i < 2; i++) {
		ctx.fillText(`№`, 10 + paddingLeft * i, 20)
		ctx.fillText(`Чемпион`, 45 + paddingLeft * i, 20)
		ctx.fillText(`Lvl`, 160 + paddingLeft * i, 20)
		ctx.fillText(`Минут`, 210 + paddingLeft * i, 20)
		ctx.fillText(`Винрейт`, 280 + paddingLeft * i, 20)
		ctx.fillText(`KDA`, 370 + paddingLeft * i, 20)
	}
	ctx.fillStyle = "#ffffff"

	for (let i = 0; i < len; i++) {
		const j =  Math.round(len / 2) // половина len в большую сторону
		const jj = Math.floor(len / 2) // половина len в меньшую сторону
		const padding = jj < i ? paddingLeft : 0 // распределение лево-право
		const k = jj < i ? i - j : i
		const paddingTop = 22 * k + 50
		const champion = champions[i]

		ctx.fillStyle = "#ffffff"
		ctx.fillText(champion.champion, 45 + padding, paddingTop)
		ctx.fillStyle = '#BB1111' // красный
		ctx.fillText(champion.Rank, 160 + padding, paddingTop)
		ctx.fillStyle = '#CDCD11' // желтый
		ctx.fillText(champion.Minutes, 210 + padding, paddingTop)
		const winrate = fixNaN((champion.Wins / (champion.Wins + champion.Losses) * 100).toFixed(0))
		ctx.fillStyle = '#32CD32' // зеленый
		ctx.fillText(`${winrate}%`, 280 + padding, paddingTop)
		const kda = ((champion.Kills + champion.Assists / 2) / (champion.Deaths + 1)).toFixed(2)
		ctx.fillStyle = '#EE5500' // оранжевый
		ctx.fillText(kda, 370 + padding, paddingTop)
		ctx.fillText(`${i + 1}.`, 10 + padding, paddingTop)
	}

	return ctx
}




/**
 * 
 */
function bot_online(message) {
	sendSite({
		method: "GET",
		url: "https://store.steampowered.com/stats/Steam-Game-and-Player-Statistics"
	})
	.then(response => {
		const body = response.body

		const res = body.match(/<tr[^<>]+>\s*?<td[^<>]+>\s*?<span[^<>]+>\s*?([0-9,\.]+)<\/span>\s*?<\/td>\s*?<td[^<>]+>\s*?<span[^<>]+>\s*?([0-9,\.]+)<\/span>\s*?<\/td>\s*?<td[^<>]+>\s*?\&nbsp;<\/td>\s*?<td[^<>]*?>\s*?<a[^<>]+>\s*?paladins/is)
		if ( !res ) return message.reply("Ошибка в парсинге, сообщите разработчику об ошибке.")
		const now = res[1],
			max = res[2]

		return message.reply(`Онлайн сейчас: **${now}**, Максимальный пик за день: **${max}**.`)
	})
}






// ---> PALADINS STATS default function --->

/**
 * проверяет на выбор аккаунта, если нужно выбрать то формирует ответ и отсылает пользователю
 * а так же выводит ошибки если они есть
 * @return {Boolean} - true если все удачно и false если нужно просто выйти
 */
function checkSelectPlayer(message, body, command='ss') {
	/**
	 * чисто проверяем пришел ли JSON
	 * при возникновении такой ошибки записываем ошибку (500 символов достаточно будет) на дискорд-сервере
	 * сообщаем об ошибке пользователю и выводим в консоль описание ошибки
	 */
	try {
		body.status === false
	} catch(err) {
		sendError(message, body)
		return false
	}

	if ( body.status === false ) {
		/**
		 * если ответ с ошибкой
		 * проверим есть ли JSON
		 * если есть, значит нужно выбрать игрока
		 */
		if ( !body.json ) {
			message.reply(body.err_msg) // будет функция которая будет сообщать еще и мне подробности ошибки
			return false
		}

		const platforms = {
			1: "Hi-Rez",
			5: "Steam",
			9: "PS4",
			10: "Xbox",
			22: "Switch",
			25: "Discord",
			28: "Epic Games"
		}
		let textReply = 'Выберите аккаунт:\r\n'
		// формируем ответ
		for (let i = 0; body.json.length > i && i < 20; i++) { // а так же не больше 20
			const player = body.json[i]
			const privacy = player.privacy_flag == "n" ? "открытый" : "скрытый"
			const portal = platforms[player.portal_id] || player.portal_id
			textReply += `**${i+1}.** id: **${player.player_id}**; portal: **${portal}**; профиль: **${privacy}**;\r\n`
		}

		if ( textReply.length > 1500 ) textReply = textReply.slice(0, 1500) + '...\r\n' // обрезаем если оч длинное
		if ( body.json.length > 20 ) textReply += '__Этот список слишком велик и был обрезан.__\r\n'

		textReply += `__Что бы выбрать аккаунт введите его id__. Пример: **!${command} 000000**`
		textReply += "\r\nВы так же можете сохранить аккаунт по ID. Пример: **!me 000000**"
		const time = body.last_update.replace(/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$3.$2.$1 $4:$5:$6')
		textReply += `\r\nОбновленно: **${time}** (UTC+0)`
		message.reply(textReply)
		return false
	}
	return true
}


function formProposals(text, maxLen) { // возвращает массив, разделяет строку на части
	if (text.length <= 25) return [text]
	let newText = []
	let tempLen = maxLen
	let lastIndex = 0

	while (true) {
		const letter = text.slice(tempLen - 1, tempLen)
		if (!letter) {
			// если пусто, то вставляем оставшееся
			const g = text.slice(lastIndex, tempLen)
			if (g) newText.push( g )
			return newText
		} else if (letter !== ' ') { // если не пустая строка то пропускаем
			tempLen-- // сдвигаем влево поиск
			// если слово 25 символов?
		} else { // если пустая строка то нужно будет разбивать
			newText.push( text.slice(lastIndex, tempLen).trim() )
			lastIndex = tempLen
			tempLen += maxLen // продолжим поиски с того места где закончили + максимальная длина
		}
	}
}

function getRank(n) { // переводит цифры в ранг
	switch (n) {
		case 1: return 'Бронза 5'
		case 2: return 'Бронза 4'
		case 3: return 'Бронза 3'
		case 4: return 'Бронза 2'
		case 5: return 'Бронза 1'
		case 6: return 'Сильвер 5'
		case 7: return 'Сильвер 4'
		case 8: return 'Сильвер 3'
		case 9: return 'Сильвер 2'
		case 10: return 'Сильвер 1'
		case 11: return 'Золото 5'
		case 12: return 'Золото 4'
		case 13: return 'Золото 3'
		case 14: return 'Золото 2'
		case 15: return 'Золото 1'
		case 16: return 'Платина 5'
		case 17: return 'Платина 4'
		case 18: return 'Платина 3'
		case 19: return 'Платина 2'
		case 20: return 'Платина 1'
		case 21: return 'Алмаз 5'
		case 22: return 'Алмаз 4'
		case 23: return 'Алмаз 3'
		case 24: return 'Алмаз 2'
		case 25: return 'Алмаз 1'
		case 26: return 'Мастер'
		case 27: return 'ГМ'
		default: return 'Калибровка'
	}
}

function secToMin(s) { // секунды в минуты или минуты в часы, принцип тот же
	let min = (s / 60).toFixed(2) + ''
	if (min.indexOf('.') != -1) { // если дробное
		let sec = (min.slice(min.indexOf('.') + 1) * 6 / 10).toFixed(0)
		min = `${min.slice(0, min.indexOf('.'))}.${sec}`
	}
	return min
}

function getWinrate(wins, loses) {
	if (!wins) return 0;
	if (!loses) return 100;
	return (wins / (loses + wins) * 100).toFixed(0);
}

function getDateStats(d) {
	return new Date(d).toLocaleString("ru", {year: 'numeric', month: 'numeric', day: 'numeric', 
		hour: 'numeric', minute: 'numeric', timeZone: "UTC", hour12: false})
}

function getKDABP(champions) { // kill, death, assist, больеш всего времени - чемпион, больше всего времени - роль
	let kills = 0, assists = 0, deaths = 0, heal = 0, dmg = 0, tank = 0, flank = 0

	for (let i = 0; i < champions.length; i++) {
		kills += champions[i].Kills
		assists += champions[i].Assists
		deaths += champions[i].Deaths

		champions.sort( (a, b) => b.Minutes - a.Minutes ) // сортируем

		switch ( getRole(champions[i].champion) ) {
			case 'dmg': dmg += champions[i].Minutes;break
			case 'flank': flank += champions[i].Minutes;break
			case 'heal': heal += champions[i].Minutes;break
			case 'tank': tank += champions[i].Minutes;break
		}
	}

	return {kills, deaths, assists, best: champions.slice(0, 5), dmg, flank, heal, tank}
}

function getRole(name) { // основываясь на имени персонажа возвращает его роль
	let heals = ["Mal'Damba", "Ying", "Grover", "Jenos", "Grohk", "Pip", "Seris", "Furia", "Io", "Corvus"],
		dmgs = ["Lian", "Cassie", "Drogoz", "Strix", "Viktor", "Sha Lin", "Bomb King", "Kinessa", "Tyra", "Vivian", "Willo", "Dredge", "Imani"],
		flanks = ["Androxus", "Buck", "Zhin", "Evie", "Koga", "Talus", "Maeve", "Skye", "Lex", "Moji", "Tiberius"],
		tanks = ["Makoa", "Fernando", "Ruckus", "Barik", "Ash", "Khan", "Torvald", "Inara", "Terminus", "Atlas", "Raum"]

	return heals.indexOf(name) != -1 ? 'heal' : 
		dmgs.indexOf(name) != -1 ? 'dmg' : 
		flanks.indexOf(name) != -1 ? 'flank' : 
		tanks.indexOf(name) != -1 ? 'tank' : false
}

function drawPieSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color) {
	ctx.fillStyle = color
	ctx.beginPath()
	ctx.moveTo(centerX, centerY)
	ctx.arc(centerX, centerY, radius, getRadians(startAngle), getRadians(endAngle))
	ctx.closePath()
	ctx.fill()
}

function fixNaN(num) {
	if (isNaN(num)) return 0
	return num
}

function getRadians(degrees) {return (Math.PI / 180) * degrees}
// <--- PALADINS STATS default function <---





/**
 * <--- ФУНКЦИИ КОМАНД БОТА <---
 */






/**
 * функция обрабатывающия сообщения для определения комманд
 */
function startListenMess(message) {
	if (message.author.bot) return false // если сообщение от бота то игнорим
	const content = message.content.replace(/[\\]+/, '')
	const authorId = message.author.id

	// если включен режим тестирования
	if ( BOT_TESTING && authorId != "510112915907543042" ) return false

	/**
	 * выполняет код создателя бота внутри, нужно для тестирования и отладки
	 */
	if (authorId == "510112915907543042" && content.startsWith("!console ")) {
		eval( content.slice(9) )
	}

	// ищем команду
	for (let i = 0; i < botCommands.length; i++ ) {
		const command = botCommands[i]
		let keyLen = null
		const commandSearch = command.commands.some(com => {
			keyLen = com.length + 1 // сохраняем, +1 что бы зацепить обязательный пробел после команды
			return content.toLowerCase().startsWith(com)
		})

		if (!commandSearch) continue // если команда не совпадает то пропускаем ее

		/**
		 * првоеряем права на отправку сообщений и прикреплению файлов (скринов)
		 */
		const type = message.channel.type // тип чата
		if (type != 'dm' && type != 'group') { // в личке проверять права не нужно
			const permission = message.channel.permissionsFor(client.user).has('SEND_MESSAGES')
			if (!permission) return // если нельзя писать сообщения то выход

			// проверяем права которые нужны для исполнения команды
			const commandPerm = ['SEND_MESSAGES', 'ATTACH_FILES']
			const checkPerm = message.channel.permissionsFor(client.user).has(commandPerm)
			if (!checkPerm) return message.reply('Недостаточно прав на отправку сообщений (файлы).')
		}

		const valParams = command.params || [] // убираем ошибку, если нет параметров
		const params = content.slice(keyLen).splitCont(valParams.length - 1)
		message.channel.startTyping() // запускаем печатание
		message.channel.stopTyping() // и сразу останавливаем (он будет печатать чутка, этого хватит)

		config.usedCommands++ // увеличиваем кол-во использованных команд
		config.usedCommandsNow++
		const guild = message.guild
		let guildName = 'ls'
		if (guild) guildName = guild.name
		console.log(`user: ${authorId}; guild: ${guildName}; func: ${command.commands[0]}; params: ${params}`)

		return command.func(message, ...params) // вызываем функцию команды передав параметры как строки
	}
}

// делает то же что и [].split, но определенное кол-во раз, а остальное возвращает как есть
String.prototype.splitCont = function(count=0, search=' ') {
	const params = []
	let indexPref = 0
	while (count) {
		const index = this.indexOf(search, indexPref) + 1
		if (index == 0) break // это может быть ошибкой, а может быть с автоподстановкой Ника
		const value = this.slice(indexPref, index).trim()
		indexPref = index
		if (value == '') continue
		params.push( value )
		count--
	}
	const value = this.slice(indexPref).trim()
	if (value != '') params.push( value )
	return params
}




/**
 *  --- ЗАПУСК БОТА ---
 * запускаем бота предварительно загрузив все необходимые данные для его работы
 */
let timeStart = new Date()
function fullStartBot() {
	timeStart = new Date()
	loadAllData()
	.then(status => {
		if (!status) return console.log("Ошибка загрузки данных.")
		client.login(config.tokenDiscord)
	}).catch(err => {
		console.log("EXIT")
		// пробовать рекконнект через время

		console.log(" -- Повторный старт через минуту...")
		setTimeout(() => {
			console.log(" ++ Начало повторного запуска...")
			config.timeStart = +new Date()
			config.usedCommands = 0
			config.usedCommandsNow = 0

			config.timeStart = +new Date()
			config.championsId = {}
			config.championsName = {}
			config.differentImg = []
			config.LegendarChampions = {}
			fullStartBot()
		}, 1000 * 60)
	})
}
fullStartBot()


/**
 * когда клиент загрузится запустим прослушку сообщений
 */
client.on("ready", () => {
	// отправляем сообщение о запуске на канал бота
	client.channels.fetch('612875033651707905')
	.then(channel => {
		if (channel) channel.send('Я запустился!')
		.catch(err => { console.log("Ошибка отправки сообщения.") })
	})

	client.user.setActivity('!hh - вывести команды бота', { type: 'WATCHING' })
	client.on("message", startListenMess)
	const timeEnd = new Date() - timeStart
	console.log(` ++ Бот запущен и готов к работе (${timeEnd}ms)`)
})


/**
 * загружает необходиммые данные для работы бота
 */
function loadAllData() {
	return new Promise((resolve, reject) => {
		const timeStart = new Date()
		load_getchampions()
		.then(status => {
			if (!status) return reject(false)

			Promise.all([
				load_championsCard(), // загружает легендарки чемпионов и добавляет их в обьект (сделать отдельно)
				getCardFrames(), // Фреймы карт
				getImgBackground(), // Фоны для статы
				getImgChampions(), // Иконки персонажей
				getImgItems(), // Предметы (item)
				getPaladinsMaps(), // Карты
				getDifferentImg(), // Разные картинки
				getRankedImage() // Иконки ранга
			]).then(endStatus => {
				if ( endStatus.find(el => el == false) === false ) return reject(false)
				const timeEnd = new Date() - timeStart
				console.log(` -- Данные загруженны. Запуск бота... (${timeEnd}ms)`)
				return resolve(true)
			})
		})
	})
}



/**
 * загружает getchampions из БД
 * это нужно что бы иметь доступ ко всем персонажам и их данным
 * устанавливает данные для:
 * 		config.championList,
 * 		config.championsId,
 * 		config.championsName
 */
function load_getchampions() {
	const timeStart = new Date()
	return new Promise((resolve, reject) => {
		const formSend = formHiRezFunc("getchampioncards")
		sendSite( formSend )
		.then(res => { // получаем данные о чемпионах с БД (обновляется раз в 24 часа)
			const body = res.body
			if (!body) return reject("body - пуст.") // если пуст - выдаем ошибку

			if (body.status === false) return reject(body. err_msg)

			if ( !body.getchampions.status ) {
				// ошибка загрузки
				return reject("Ошибка загрузки load_getchampions :(")
			}

			config.championList = body.getchampions.json
			config.championsCard = body.getchampioncards.json

			formChampions() // записываем чемпионов и формируем данные для удобства
			const timeEnd = new Date() - timeStart
			console.log(`getchampions и getchampioncards успешно загруженны и записанны. (${timeEnd}ms)`)
			return resolve(true)
		})
	}).catch(err => {
		console.log("\r\nОшибка load_getchampions. Ошибка:")
		console.log(err)
		console.log("")
		return false
	})
}


/**
 * записываем чемпионов и формируем данные для удобства
 */
function formChampions() {
	config.championList.forEach(champion => {
		champion.Roles = champion.Roles.replace(/paladins /ig, "")

		config.championsId[ champion.id ] = champion
		config.championsName[ champion.Name_English ] = champion
		config.championsName[ champion.Name_English.toLowerCase() ] = champion
		config.championsName[ champion.Name_English.replace(/[ ']/i,'') ] = champion
		config.championsName[ champion.Name_English.replace(/[ ']/i,'').toLowerCase() ] = champion

		config.championsName[ champion.Name ] = champion // на русском
		config.championsName[ champion.Name.toLowerCase() ] = champion // на русском
		config.championsName[ champion.Name.replace(/[ ']/i,'') ] = champion // на русском
		config.championsName[ champion.Name.replace(/[ ']/i,'').toLowerCase() ] = champion // на русском
		if (champion.Name_English == "Mal'Damba") config.championsName[ "maldamba" ] = config.championsName[ "mal damba" ] = champion
	})
}


/**
 * загружает легендарки чемпионов и добавляет их в обьект
 * (должно быть запущенно строго после загрузки load_getchampions)
 */
function load_championsCard() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const body = config.championsCard

		// выбираем леги для загрузки
		const list = []
		for (let championId in body) {
			const cards = body[championId]
	
			for (let i = 0; i < cards.length; i++) {
				const item = cards[i]
	
				/**
				 * так как легендарки используются часто то загружаем их в память
				 * легендарки загрузит полюбому так как они есть у нас в папке
				 */
				if (item.rarity != 'Legendary') continue
				list.push( loadImage(`legendary/${item.card_id2}.png`) )
			}
		}

		Promise.all(list) // загружаем леги
		.then(imgList => {
			let k = 0
			for (let championId in body) {
				const cards = body[championId]
		
				for (let i = 0; i < cards.length; i++) {
					const item = cards[i]
		
					if (item.rarity != 'Legendary') continue
					config.LegendarChampions[item.card_id2] = imgList[k]
					k++
				}
			}
			const timeEnd = new Date() - timeStart
			console.log(`Легендарки чемпионов загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает фреймы карт в буфер (рамки)
 */
function getCardFrames() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		list.push( loadImage("card_frames/1.png") )
		list.push( loadImage("card_frames/2.png") )
		list.push( loadImage("card_frames/3.png") )
		list.push( loadImage("card_frames/4.png") )
		list.push( loadImage("card_frames/5.png") )

		Promise.all(list)
		.then(imgList => {
			config.cardFrames = imgList
			const timeEnd = new Date() - timeStart
			console.log(`Фреймы карт загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает фоны для статы в буфер
 */
function getImgBackground() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		list.push( loadImage(`stats-img/stats-background-1.jpg`) )
		list.push( loadImage(`stats-img/stats-background-2.jpg`) )
		list.push( loadImage(`stats-img/stats-background-3.jpg`) )

		Promise.all(list)
		.then(imgList => {
			config.imgBackground = imgList
			const timeEnd = new Date() - timeStart
			console.log(`Фоны для статы загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает иконки чемпионов (вроде после того ?)
 */
function getImgChampions() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		for (let championId in config.championsId) {
			const champion = config.championsId[championId]
			const champName = champion.Name_English.toLowerCase()
			list.push( loadImage(`champions/${champName}.jpg`) )
		}

		Promise.all(list)
		.then(imgList => {
			let i = 0
			for (let championId in config.championsId) {
				config.championsId[championId].loadedImg = imgList[i]
				i++
			}

			const timeEnd = new Date() - timeStart
			console.log(`Иконки персонажей загружены. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает картинки закупки (items)
 */
function getImgItems() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		for (let item in paladinsItems) {
			list.push( loadImage(`items/${item}.jpg`) )
		}

		Promise.all(list)
		.then(imgList => {
			let i = 0
			for (let item in paladinsItems) {
				paladinsItems[item] = imgList[i]
				i++
			}
			const timeEnd = new Date() - timeStart
			console.log(`Предметы (item) загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает игровые карты (местность)
 */
function getPaladinsMaps() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		for (let map in paladinsMaps) {
			list.push( loadImage(`maps/${map}.png`) )
		}

		Promise.all(list)
		.then(imgList => {
			let i = 0
			for (let item in paladinsMaps) {
				paladinsMaps[item] = imgList[i]
				i++
			}
			const timeEnd = new Date() - timeStart
			console.log(`Карты загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает другие изображениея
 */
function getDifferentImg() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		list.push( loadImage(`vs.png`) )

		Promise.all(list)
		.then(imgList => {
			config.differentImg['vs'] = imgList[0]
			const timeEnd = new Date() - timeStart
			console.log(`Разные картинки загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}


/**
 * загружает изображения рейтинговых званий
 */
function getRankedImage() {
	const timeStart = new Date()
	return new Promise(resolve => {
		const list = []
		for (let i = 0; i <= 27; i++) {
			list.push( loadImage(`divisions/${i}.png`) )
		}

		Promise.all(list)
		.then(imgList => {
			config.rankedImage = imgList
			const timeEnd = new Date() - timeStart
			console.log(`Иконки ранга загруженны. (${timeEnd}ms)`)
			resolve(true)
		})
	})
}



/**
 * облегчаем формирование запросов к БД
 * @param {String} command - имя вызываемой функции
 * @param {Number} discord_id - id дискорда пользователя написавшего особщение (для поиска сохраненного никнейма)
 * @param {Array} params - параметры для функции
 */
function formHiRezFunc(command, discord_id=null, ...params) {
	return {
		url: "https://webmyself.ru/pal-bot/bot_api.php",
		method: "POST",
		json: true,
		form: {
			token: config.dbToken,
			command,
			discord_id,
			params
		}
	}
}



/**
 * отправляем ошибку на канал бота, в консоль и сообщает пользователю об ошибке
 * тип ошибки - запрос с сайта
 * @param {*} message 
 * @param {*} body 
 */
function sendError(message, body) {
	console.log("\r\nВозникла ошибка при получении данных с сайта. ERR:")
	console.log(err)
	client.channels.fetch('696604376034181140')
	.then(channel => {
		if (channel) channel.send( body.slice(0, 500) )
		.catch(err => { console.log("Ошибка отправки сообщения.") })
	})
	return message.reply("Возникла ошибка при запросе, повторите комманду снова. Если ошибка не пропадает сообщите о ней разработчикам.")
}




setInterval(setStatsToSite, 60000) // обновляем статистику для сайта каждую минуту

function setStatsToSite() {
	const url = "https://webmyself.ru/bot_new.php"
	const token = config.dbToken
	const timeWork = new Date() - config.timeStart
	let users = 0
	let servers = 0

	client.guilds.cache.forEach(guild => {
		servers++
		users += guild.memberCount
	})

	const usedCommands = config.usedCommands
	const usedCommandsNow = config.usedCommandsNow
	config.usedCommands = 0

	sendSite({method: "POST", url, form: {
		token, type: 'stats_new', servers, users, usedCommands, usedCommandsNow, timeWork
	}}).then (res => {
		console.log(res.body) // успешно отправленно
		try {
			const body = JSON.parse(res.body)
			if ( body.status != "OK") {
				config.usedCommands += usedCommands // возвращаем их назад
			}
		} catch(e) {
			console.log("Ошибка 'stats_new':")
			console.log(e)
			config.usedCommands += usedCommands // возвращаем их назад
		}
		// можно так же получать в ответ изменившиеся настройки команд для серверов (экономим запросы)
	})
}


