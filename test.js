const getSchedule = require('./schedule');
let data = require('./data');
const util = require('util');
const assert = require('assert');

let result = getSchedule(data);

console.log(util.inspect(result, { breakLength: 200 }));

// совпадает ли consumedEnergy.value
{
	let diff = Math.abs(result.consumedEnergy.value - 38.939);
	assert.ok(diff <= 0.5, 'consumedEnergy.value is invalid');
};

// совпадает ли consumedEnergy.devices
{
	let identificators = ['F972B82BA56A70CC579945773B6866FB', 'C515D887EDBBE669B2FDAC62F571E9E9', '02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', '7D9DC84AD110500D284B33C82FE6E85E'];
	let values = [5.1015, 21.52, 5.398, 5.398, 1.5215];

	for(let i = 0; i < 5; i++) {
		let diff = Math.abs(result.consumedEnergy.devices[`${identificators[i]}`] - values[i]);
		assert.ok(diff <= 0.5, `${identificators[i]}'s value is invalid`);
	};
};

// верно ли число устройств в результирующем объекте
{
	assert.equal(Object.keys(result.consumedEnergy.devices).length, 5, 'Number of devices in result object is wrong');
};

// включают ли в себя массивы часов нужные устройства
{
	for(let i = 0; i < 24; i++) {
		assert.equal(result.schedule[i].includes('02DDD23A85DADDD71198305330CC386D'), true, `${i} hour doesn't include a 02DDD23A85DADDD71198305330CC386D`);
	};

	for(let i = 0; i < 24; i++) {
		assert.equal(result.schedule[i].includes('1E6276CC231716FE8EE8BC908486D41E'), true, `${i} hour doesn't include a 1E6276CC231716FE8EE8BC908486D41E`);
	};

	for(let i = 0; i < 3; i++) {
		assert.equal(result.schedule[i].includes('F972B82BA56A70CC579945773B6866FB'), true, `${i} hour doesn't include a F972B82BA56A70CC579945773B6866FB`);
	};

	for(let i = 0; i < 1; i++) {
		assert.equal(result.schedule[i].includes('7D9DC84AD110500D284B33C82FE6E85E'), true, `${i} hour doesn't include a 7D9DC84AD110500D284B33C82FE6E85E`);
	};

	for(let i = 10; i < 12; i++) {
		assert.equal(result.schedule[i].includes('C515D887EDBBE669B2FDAC62F571E9E9'), true, `${i} hour doesn't include a C515D887EDBBE669B2FDAC62F571E9E9`);
	};
};

// нет ли лишних устройств в расписании
{
	assert.equal(result.schedule['0'].length, 4, '0 hour is wrong');

	for(let i = 1; i < 3; i++) {
		assert.equal(result.schedule[i].length, 3, '1 to 3 hours are wrong');
	};

	for(let i = 3; i < 10; i++) {
		assert.equal(result.schedule[i].length, 2, '3 to 10 hours are wrong');
	};

	for(let i = 10; i < 12; i++) {
		assert.equal(result.schedule[i].length, 3, '10 to 12 hours are wrong');
	};

	for(let i = 12; i < 24; i++) {
		assert.equal(result.schedule[i].length, 2, '12 to 24 hours are wrong');
	};
};