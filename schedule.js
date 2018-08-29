let data = require('./data'); // входные данные вынесены в отдельный файл для удобства

// функция, которая добавляет интервал работы девайса в результирующий объект
let pushInterval = (resultObject, id, from, to) => {
	let iterations = to - from + 1;

	for (let i = 0; i < iterations; i++) {
		let iterationHour = from + i; // час, в массив которого мы будем пушить айди девайса
		resultObject.schedule[iterationHour].push(id); // вставляем в конец массива айди девайса
	};
};

// функция, которая добавляет в объект нужные свойства(инициализация)
let initResultObject = (resultObject) => {
	resultObject.schedule = {};
	for (let i = 0; i < 24; i++) {
		resultObject.schedule[i] = [];
	};

	resultObject.consumedEnergy = {};
	resultObject.consumedEnergy.value = 0;
	resultObject.consumedEnergy.devices = {};
};

// функция, которая считает энергию, потраченную конкретным прибором
let getConsumedEnergyByDevice = (resultObject, id) => {};

// функция, которая в конце выполнения скрипта записывает детали потраченной энергии
let generateConsumedEnergyDetails = (resultObject) => {};

let comparePowerConsumptionReversed = (device1, device2) => {
	return device2.powerConsumption - device1.powerConsumption;
};


// основная функция, принимает объект с данными и возвращает объект с расписанием
let getSchedule = (data) => {
	let result = {}; // объявим результирующий объект
	initResultObject(result); // инициализируем в нём нужные свойства

	// сначала проверим есть ли приборы, работающие 24 часа
	data.devices.forEach((device, i, devices) => {
		if (device.duration === 24) {
			pushInterval(result, device.id, 0, 23); // добавляем прибор в расписание
		};
	});

	// отфильтруем данные от уже добавленных приборов
	data.devices = data.devices.filter(device => device.duration !== 24);

	// считаем кВт·ч каждого прибора, сортируем по этому параметру
	data.devices.forEach(device => device.powerConsumption = (device.power / 1000 * device.duration).toFixed(4));
	data.devices.sort(comparePowerConsumptionReversed);
	console.log(data.devices);

	return result;
};

console.log(getSchedule(data)); // проверяем инициализированный массив