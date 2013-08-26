var fs = require('fs'),
    path = require('path')

var DEVICE_PATH = '/sys/bus/w1/devices/',
    PATTERN = /crc=\w+ YES\n.*t=(\d+)/

function TemperatureSensor(index) {
    this.index = index || 0
}

TemperatureSensor.prototype.read = function(callback) {
    if (!this.path) {
        var self = this

        fs.readdir(DEVICE_PATH, function(err, files) {
            if (err) return callback(err)

            var sensors = files.filter(function(filename) {
                return filename.indexOf('28-') === 0
            })

            if (!sensors.length) return callback(new Error('No sensors detected.'))

            self.path = path.join(DEVICE_PATH, sensors[self.index], 'w1_slave')
        })
    } else {
        fs.readFile(this.path, 'utf8', function(err, data) {
            if (err) return callback(err)

            var matches = PATTERN.exec(data),
                temperature = matches ? parseInt(matches[1], 10) / 1000 : -1

            callback(null, temperature)
        })
    }
}

module.exports = TemperatureSensor
