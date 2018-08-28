// функция, которая добавляет интервал работы девайса в результирующий объект
let pushInterval = (resultObject, id, from, to) => {
	let iterations = to - from + 1;

	for (let i = 0; i < iterations; i++) {
		let iterationHour = from + i; // час, в массив которого мы будем пушить айди девайса
		let pushLine = `resultObject.schedule['${iterationHour}'].push(id);`; // строка кода, в которой происходит сам пуш
		eval(pushLine);
	};
};

// функция, которая добавляет в объект нужные свойства(инициализация)
let initResultObject = (resultObject) => {
	resultObject.schedule = {};
	for (let i = 0; i < 24; i++) {
		let initLine = `resultObject.schedule['${i}'] = [];`;
		eval(initLine);
	};

	resultObject.consumedEnergy = {};
	resultObject.consumedEnergy.value = 0;
	resultObject.consumedEnergy.devices = {};
};

// основная функция, принимает объект с данными и возвращает объект с расписанием
let getSchedule = (data) => {
	let result = {}; // объявим результирующий объект
	initResultObject(result); // инициализируем в нём нужные свойства

	return result;
};

console.log(getSchedule()); // проверяем инициализированный массив