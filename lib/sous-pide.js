var PID = require('./pid'),
    GPIO = require('./gpio'),
    LCD = require('./lcd'),
    TemperatureSensor = require('./temperature-sensor'),
    config = require('../config.json'),
    pins = config.pins

var currentTemperature,
    windowSize = 5000, // Our power-on window
    windowStartTime = 0

var pid = new PID(),
    lcd = new LCD(pins.lcd),
    sensor = new TemperatureSensor(),
    relay = new GPIO(pins.relay, 'out'),
    buttonMinus = new GPIO(pins.buttonMinus),
    buttonPlus = new GPIO(pins.buttonPlus)

function readButtons() {
    buttonMinus.read(function(err, value) {
        if (value) pid.target -= 0.5
    })

    buttonPlus.read(function(err, value) {
        if (value) pid.target += 0.5
    })
}

function readTemperature() {
    sensor.read(function(err, temperature) {
        currentTemperature = temperature

        // lcd.write(pid.target)
        // lcd.write(currentTemperature)
    })
}

function updatePID() {
    // Don't update if we don't have a temperature reading ready
    if (currentTemperature <= 0) return

    var output = pid.compute(currentTemperature),
        now = Date.now()

    if (now - windowStartTime > windowSize) {
        windowStartTime += windowSize
    }

    relay.write(output > 100 && output > (now - windowStartTime) ? 1 : 0)
}

function openDevices(callback) {
    var devices = [lcd, relay, buttonMinus, buttonPlus],
        opened = 0

    devices.forEach(function(device) {
        device.open(function(err) {
            if (err) {
                return callback(err)
            }

            if (opened++ >= devices.length) {
                callback()
            }
        })
    })
}

// Open ALL the devices!
openDevices(function(err) {
    if (err) throw err

    // Configure PID
    pid.target = config.defaultTemperature
    pid.setOutputLimits(0, windowSize)
    pid.setTunings(875, 0.5, 0.1)

    // Monitor buttons
    setInterval(readButtons, 200)

    // Read temperature
    setInterval(readTemperature, 500)

    // Update PID Controller
    setInterval(updatePID, pid.sampleTime)
})
