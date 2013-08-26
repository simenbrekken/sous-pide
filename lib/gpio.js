var fs = require('fs'),
    exec = require('child_process').exec

var PINS = {
    3:  2,
    5:  3,
    7:  4,
    8:  14,
    10: 15,
    11: 17,
    12: 18,
    13: 27,
    15: 22,
    16: 23,
    18: 24,
    19: 10,
    21: 9,
    22: 25,
    23: 11,
    24: 8,
    26: 7
}

function GPIO(pin, direction) {
    this.pin = pin
    this.direction = direction || 'in'
}

GPIO.prototype.path = function(filename) {
    return '/sys/devices/virtual/gpio' + PINS[this.pin] + '/' + filename
}

GPIO.prototype.open = function(callback) {
    var self = this

    exec('gpio-admin export ' + PINS[this.pin], function(err) {
        if (err) return callback && callback(err)

        self.setDirection(self.direction, callback)
    })
}

GPIO.prototype.close = function(direction, callback) {
    exec('gpio-admin unexport ' + PINS[this.pin], function(err) {
        if (err) return callback && callback(err)
    })
}

GPIO.prototype.setDirection = function(direction, callback) {
    fs.writeFile(this.path('direction'), direction, callback)
}

GPIO.prototype.read = function(callback) {
    fs.readFile(this.path('value'), 'utf8', function(err, value) {
        if (err) return callback(err)

        callback(err, parseInt(value, 10))
    })
}

GPIO.prototype.write = function(value, callback) {
    fs.writeFile(this.path('value'), value, 'utf8', callback)
}

module.exports = GPIO
