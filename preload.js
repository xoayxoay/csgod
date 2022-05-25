const Selenium = require('./class/selenium');
const timeOut = require('./class/timeOut');

function init() {
	global.window.Selenium = Selenium;
  	global.window.timeOut = timeOut;
}

init();
