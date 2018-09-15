// функция, которая добавляет интервал работы девайса в результирующий объект
let pushInterval = (resultObject, device, from, to) => {
	let iterations = to - from + 1;

	for (let i = 0; i < iterations; i++) {
		let iterationHour = from + i; // час, в массив которого мы будем пушить айди девайса
		resultObject.schedule[iterationHour].push(device.id);
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

	if (endRate - beginRate === 0) {
		value += (to - from + 1) * rates[beginRate].value * device.power / 1000;
	} else {
		for (let k = 0; k < endRate - beginRate + 1; k++) {
			if (beginRate + k === beginRate) {
				// если это первый промежуток тарифов в интервале
				value += (rates[beginRate + k].to - from) * rates[beginRate + k].value * device.power / 1000;
			};

			if ((beginRate + k > beginRate) && (beginRate + k < endRate)) {
				// если это промежуточный промежуток тарифов в интервале
				value += (rates[beginRate + k].to - rates[beginRate + k].from) * rates[beginRate + k].value * device.power / 1000;
			};

			if (beginRate + k === endRate) {
				// если это последний промежуток тарифов в интервале
				value += (to - rates[beginRate + k].from + 1) * rates[beginRate + k].value * device.power / 1000;
			};
		};
	};

	return value;
};

// функция, которой передается прибор для записи подробнотей
let writeConsumedEnergyDetails = (resultObject, device, interval) => {
	resultObject.consumedEnergy.devices[`${device.id}`] = interval.value;

	resultObject.consumedEnergy.value += interval.value;

	// проблему с неточным хранением чисел по стандарту IEEE 754 решаем с помощью округления до трех знаков
	// делаем приведение к числу, чтобы в следующий раз коррекнтно вызвать метод .toFixed()
	resultObject.consumedEnergy.value = +(resultObject.consumedEnergy.value).toFixed(3);
};

let comparePowerConsumptionReversed = (device1, device2) => {
	return device2.powerConsumption - device1.powerConsumption;
};

let compareRates = (rate1, rate2) => {
	return rate1.from - rate2.from;
};

let transformRates = (rates) => {
	rates.forEach(rate => {
		if (rate.from > rate.to) {
			let tempRate = {};
			tempRate.from = 0;
			tempRate.to = rate.to;
			rate.to = 24;
			tempRate.value = rate.value;
			rates.push(tempRate);
		};
	});
	rates.sort(compareRates);
};

let checkMaxPower = (devices, maxPower, schedule, device, from, to) => {
	let flag = true;

	for (let rowCounter = 0; rowCounter < to - from + 1; rowCounter++) {
		let powerSum = 0;
		for (let positionCounter = 0; positionCounter < schedule[`${from + rowCounter}`].length; positionCounter++) {
			powerSum += devices.find(obj => schedule[`${from + rowCounter}`][positionCounter] === obj.id).power;
		};

		if (powerSum + device.power > maxPower) {
			flag = false;
		};
	};

	return flag;
};

let searchInterval = (dataObject, resultObject, device) => {
	let interval = {};
	let start, end;

	switch (device.mode) {
		case 'day': {
			start = 7;
			end = 20;

			let passes = end - start + 1 - device.duration + 1; // кол-во проходов
			let minSpent = {};

			// проходимся по всем элементам
			for (let i = 0; i < passes; i++) {
				if ((minSpent.value === undefined) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};

				if ((minSpent.value !== undefined) && (getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1) < minSpent.value) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};
			};

			interval.from = minSpent.from;
			interval.to = minSpent.to;
			interval.value = minSpent.value;
		};
			break;
		case 'night': {
			// первый промежуток ночи это с 21 до 23
			start = 21;
			end = 23;

			let passes = end - start + 1 - device.duration + 1; // кол-во проходов
			let minSpent = {};

			// проходимся по всем элементам
			for (let i = 0; i < passes; i++) {
				if ((minSpent.value === undefined) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};

				if ((minSpent.value !== undefined) && (getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1) < minSpent.value) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};
			};

			interval.from = minSpent.from;
			interval.to = minSpent.to;
			interval.value = minSpent.value;
		};

		{
			// второй промежуток ночи это с 0 до 6
			start = 0;
			end = 6;

			let passes = end - start + 1 - device.duration + 1; // кол-во проходов
			let minSpent = {};

			// проходимся по всем элементам
			for (let i = 0; i < passes; i++) {
				if ((minSpent.value === undefined) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};

				if ((minSpent.value !== undefined) && (getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1) < minSpent.value) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};
			};

			if (minSpent.value < interval.value) {
				interval.from = minSpent.from;
				interval.to = minSpent.to;
				interval.value = minSpent.value;
			};
		};
			break;
		case undefined: {
			start = 0;
			end = 23;

			let passes = end - start + 1 - device.duration + 1; // кол-во проходов
			let minSpent = {};

			// проходимся по всем элементам
			for (let i = 0; i < passes; i++) {
				if ((minSpent.value === undefined) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};

				if ((minSpent.value !== undefined) && (getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1) < minSpent.value) && (checkMaxPower(dataObject.devices, dataObject.maxPower, resultObject.schedule, device, start + i, start + i + device.duration - 1))) {
					minSpent.value = getSpentMoneyByDevice(dataObject.rates, device, start + i, start + i + device.duration - 1);
					minSpent.from = start + i;
					minSpent.to = start + i + device.duration - 1;
				};
			};

			interval.from = minSpent.from;
			interval.to = minSpent.to;
			interval.value = minSpent.value;
		};
			break;
		default:
		throw new Error('invalid device mode');
	};

	return interval;
};

// основная функция, принимает объект с данными и возвращает объект с расписанием
let getSchedule = (data) => {
	let result = {}; // объявим результирующий объект
	initResultObject(result); // инициализируем в нём нужные свойства

	// значения свойства pushed каждого девайса:
	// undefined: мы еще не работали с девайсом
	// true: девайс уже запушен в расписание
	// false: девайс уже был запушен, но мы решили что-то изменить(например, подвинуть его из-за невлезания другого прибора)

	// считаем кВт·ч каждого прибора, сортируем по этому параметру
	data.devices.forEach(device => device.powerConsumption = +(device.power / 1000 * device.duration).toFixed(4));
	data.devices.sort(comparePowerConsumptionReversed);
	// console.log(data.devices);

	// сортируем тарифы от 0 до 23 часов
	transformRates(data.rates);
	// console.log(data.rates);

	// ищем интервал работы для каждого устройства
	data.devices.forEach(device => {
		if (device.pushed === undefined) {
			let interval = searchInterval(data, result, device);
			interval.value = +interval.value.toFixed(4);
			// console.log(interval);
			pushInterval(result, device, interval.from, interval.to);
			device.pushed = true;
			writeConsumedEnergyDetails(result, device, interval);
		};
	});

	return result;
};

module.exports = getSchedule;