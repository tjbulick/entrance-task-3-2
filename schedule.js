let data = require('./data'); // входные данные вынесены в отдельный файл для удобства
const util = require('util');

// функция, которая добавляет интервал работы девайса в результирующий объект
let pushInterval = (resultObject, device, from, to) => {
	let iterations = to - from + 1;

	for (let i = 0; i < iterations; i++) {
		let iterationHour = from + i; // час, в массив которого мы будем пушить айди девайса
		resultObject.schedule[iterationHour].push(device.id); // вставляем в конец массива айди девайса
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
let getSpentMoneyByDevice = (rates, device, from, to) => {
	let value = 0;
	let beginRate, endRate;
	rates.forEach((rate, j) => {
		if ((from >= rate.from) && (from < rate.to)) {
			beginRate = j;
		};

		if ((to >= rate.from) && (to < rate.to)) {
			endRate = j;
		};
	});
	console.log(beginRate, endRate);

	if (endRate - beginRate === 0) {
		value += (to - from + 1)*rates[beginRate].value;
	} else {
		for (let k = 0; k < endRate - beginRate + 1; k++) {
			if (beginRate + k === beginRate) {
				// если это первый промежуток тарифов в интервале
				value += (rates[beginRate + k].to - from)*rates[beginRate + k];
			};

			if ((beginRate + k > beginRate) && (beginRate + k < endRate)) {
				// если это промежуточный промежуток тарифов в интервале
				value += (rates[beginRate + k].to - rates[beginRate + k].from)*rates[beginRate + k];
			};

			if (beginRate + k === endRate) {
				// если это последний промежуток тарифов в интервале
				value += (to - rates[beginRate + k].from + 1)*rates[beginRate + k];
			};
		};
	};

	return value;
};

// функция, которая в конце выполнения скрипта записывает детали потраченной энергии
let generateConsumedEnergyDetails = (resultObject) => {};

let comparePowerConsumptionReversed = (device1, device2) => {
	return device2.powerConsumption - device1.powerConsumption;
};

let checkMaxPower = (maxPower, schedule, device, from, to) => {
	return true;
};

let searchInterval = (dataObject, resultObject, device) => {
	let interval = {};
	let start, end;

	switch (device.mode) {
		case 'day':
			start = 7;
			end = 20;

			let passes = end - start + 1 - device.duration + 1; // кол-во проходов
			let minSpent = {
				value: getSpentMoneyByDevice(dataObject.rates, device, start, start + device.duration - 1),
				from: start,
				to: start + device.duration - 1
			};

			// проходимся по всем элементам, кромер первого(первый присвоен минимуму)
			for (let i = 1; i < passes; i++) {
				if ((getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1) < minSpent.value) && (checkMaxPower(dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};
			};

			interval.from = minSpent.from;
			interval.to = minSpent.to;
			break;
		case 'night':
			// start = 21;
			// end = 6;
			break;
		case undefined:
			start = 0;
			end = 23;
			break;
		default:
		console.log('invalid device mode');
	};

	return interval;
};

// основная функция, принимает объект с данными и возвращает объект с расписанием
let getSchedule = (data) => {
	let result = {}; // объявим результирующий объект
	initResultObject(result); // инициализируем в нём нужные свойства

	// сначала проверим есть ли приборы, работающие 24 часа
	data.devices.forEach(device => {
		if (device.duration === 24) {
			pushInterval(result, device, 0, 23);
		};
	});

	// отфильтруем данные от уже добавленных приборов
	data.devices = data.devices.filter(device => device.duration !== 24);

	// считаем кВт·ч каждого прибора, сортируем по этому параметру
	data.devices.forEach(device => device.powerConsumption = (device.power / 1000 * device.duration).toFixed(4));
	data.devices.sort(comparePowerConsumptionReversed);
	console.log(data.devices);

	// ищем интервал работы для каждого устройства
	data.devices.forEach(device => {
		let interval = searchInterval(data, result, device);
		// console.log(interval);
		pushInterval(result, device, interval.from, interval.to);
	});

	return result;
};

// console.log(util.inspect(getSchedule(data), { breakLength: 200 })); // проверяем выходные данные
console.log(getSpentMoneyByDevice(data.rates, data.devices[2], 0, 2));

