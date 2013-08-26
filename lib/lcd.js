var GPIO = require('./gpio')

function LCD(pin) {
    this.gpio = new GPIO(pin, 'out')
}

LCD.prototype.open = function(callback) {
    this.gpio.open(callback)
}

LCD.prototype.write = function(value, row, column) {
    console.log('LCD:', value)
}

module.exports = LCD
