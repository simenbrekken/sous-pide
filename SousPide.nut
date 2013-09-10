// Adapted from https://github.com/br3ttb/Arduino-PID-Library

pid <- {
    p = 875 // Proportional
    i = 0 // Integral
    d = 0 // Derivative

    target = 0 // Target temperature
    min = 0 // Minimum output value
    max = 100 // Maximum output value
    sampleTime = 1 // Time between samples (calls to compute) in seconds

    lastInput = 0
    errorSum = 0
    output = 0

    function compute(input) {
        local error = target - input
        local diff = input - lastInput

        lastInput = input
        errorSum = limit(errorSum + (i * sampleTime * error))
        output = limit((p * error)  + errorSum + ((d / sampleTime) * diff))

        return output
    }

    function limit(value) {
        if (value < min) {
            return min
        } else if (value > max) {
            return max
        }

        return value
    }
}

oneWire <- {
    RX = 0x00
    TX = 0xff
    RESET = 0xf0

    serial = hardware.uart12

    function reset() {
        serial.configure(9600, 8, PARITY_NONE, 1, NO_CTSRTS)
        serial.write(RESET)

        if (serial.read() == RESET) {
            server.log("Could not detect 1-Wire device")

            return false
        }

        serial.configure(115200, 8, PARITY_NONE, 1, NO_CTSRTS)

        return true
    }

    function read() {
        local byte = 0x0

        for (local b = 0; b < 8; b++) {
            serial.write(TX)

            if (serial.read() == TX) {
                byte += 0x01 << b
            }
        }

        return byte
    }

    function write(byte) {
        local bit = RX

        for (local b = 0; b < 8; b++, byte = byte >> 1) {
            bit = byte & 0x01 ? TX : RX

            serial.write(bit)

            if (serial.read() != bit) {
                serverl.log("Error writing to 1-Wire device")
            }
        }
    }
}

temperatureSensor <- {
    SKIP_ROM = 0xcc
    CONVERT = 0x44
    READ_SCRATCHPAD = 0xbe

    bus = oneWire
    temperature = 0

    function send(command) {
        bus.reset()
        bus.write(SKIP_ROM)
        bus.write(command)
    }

    function read() {
        // Attempt to read current data on scratchpad
        command(READ_SCRATCHPAD)

        // TODO: Check that we have a valid reading, sometimes the sensor returns -127C because of noise
        local low = bus.read()

        if (low) {
            local high = bus.read() * 256

            temperature = (low + high) / 16
        }

        // Request temperature conversion
        send(CONVERT)
    }
}

// 10 second TPO (Time Proportional Output) window
local windowSize = 10000
local windowStartTime = 0

updatePID <- function() {
    temperature = temperatureSensor.read()

    if (temperature > 0) {
        pid.compute(temperature)
    }

    // Sleep for 1s before computing the a output value
    imp.wakeup(pid.sampleTime, updatePID)
}

updateRelay <- function() {
    local now = hardware.millis()
    local output = pid.output

    // Shift TPO window
    if (now - windowStartTime > windowSize) {
        windowStartTime += windowSize
    }

    // Update relay based on the calculated "on time"
    // The relay is not switched unless "on time" is longer than 100, this to limit relay wear
    if ((output > 100) && (output > (now - windowStartTime))) {
        server.log("Relay on")
    } else {
        server.log("Relay off")
    }

    // Sleep for 10ms before updating the relay again
    imp.wakeup(0.01, updateRelay)
}

// Configure
pid.max = windowSize // Scale PID output to TPO window
pid.target = 55

// Wake the imp up, time to get to work!
imp.wakeup(2.0, updatePID)
imp.wakeup(2.0, updateRelay)
