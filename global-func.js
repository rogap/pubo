// команды которые используются не в 1 файле



exports.getRandomItemArry = function(arr) { // возвращает случайное содержимое из массива
	const rand = Math.floor(Math.random() * arr.length);
	return arr[rand];
}



exports.isAdmin = function(id) { // проверка на админку в боте
	for (let i = 0; i < adminListId.length; i++) {
		if (adminListId[i].indexOf(id) == 0) return true;
	}
	return false;
}
adminListId = ['510112915907543042', '244114707676397569', '423102664532951071']; // список id аков с админкой



/* addBotMess - добавляет промисы-сообщения в массив
 * @promiseMess - промис, который возвращается после отправки сообщения
 * @id - id канала, что бы записать сообщение в его список
 * @messObj - обьект с сообщениями бота
 */
exports.addBotMess = function(promiseMess, id, messObj) { // добавляет промисы-сообщения в массив
	if (!messObj[id]) messObj[id] = [];
	messObj[id].push(promiseMess);
}



/* delleteBotMess - удаляет все сообщения бота на указанном канале
 * @id - id канала на котором удалить сообщения
 * @messObj - обьект с сообщениями бота
 */
exports.delleteBotMess = function(id, messObj) { // удаляет все сообщения бота на канале
	if (!messObj[id]) return messObj[id] = [];
	for (let i = 0; i < messObj[id].length; i++) {
		messObj[id][i].then( (e) => {e.delete(50)});
	}
	messObj[id] = []; // очищаем массив
}