oneWire <- {
    RX = 0x00
    TX = 0xff
    RESET = 0xf0

    function reset() {
        hardware.uart57.configure(9600, 8, PARITY_NONE, 1, NO_CTSRTS)
        hardware.uart57.write(RESET)

        if (hardware.uart57.read() == RESET) {
            server.log("Could not detect 1-Wire device")

            return false
        }

        hardware.uart57.configure(115200, 8, PARITY_NONE, 1, NO_CTSRTS)

        return true
    }

    function read() {
        local byte = 0x0

        for (local b = 0; b < 8; b++) {
            hardware.uart57.write(TX)

            if (hardware.uart57.read() == TX) {
                byte += 0x01 << b
            }
        }

        return byte
    }

    function write(byte) {
        local bit = RX

        for (local b = 0; b < 8; b++, byte = byte >> 1) {
            bit = byte & 0x01 ? TX : RX

            hardware.uart57.write(bit)

            if (hardware.uart57.read() != bit) {
                server.log("Error writing to 1-Wire device")
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
        if (bus.read() == 0xff) {
            send(READ_SCRATCHPAD)

            local low = bus.read()

            if (low > 0) {
                local high = bus.read() * 256

                temperature = (low + high) / 16.0
            }
        }

        // Request temperature conversion
        send(CONVERT)

        return temperature
    }
}

// Adapted from https://github.com/br3ttb/Arduino-PID-Library
pid <- {
    p = 875 // Proportional
    i = 0 // Integral
    d = 0 // Derivative

    target = 55 // Target temperature
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

// 10 second TPO (Time Proportional Output) window
windowSize <- 10000
windowStartTime <- 0

updatePID <- function() {
    local temperature = temperatureSensor.read()

    if (temperature > 0) {
        pid.compute(temperature)

        agent.send("update", {
            temperature = temperature
            output = pid.output
        })
    }

    // Sleep for 1s before updating again
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

configure <- function(config) {
    server.log(format("Configuring, target: %.1f, p: %d, i: %.1f, d: %.1f", config.target, config.p, config.i, config.d))

    pid.p = config.p
    pid.i = config.i
    pid.d = config.d
    pid.target = config.target
}

imp.configure("Sous Pide", [], [])
agent.on("configure", configure)

oneWire.reset() // Make sure 1-Wire is ready
pid.max = windowSize // Scale PID output to our TPO window

// Wake the imp up, time to get to work!
updatePID()
//updateRelay()
