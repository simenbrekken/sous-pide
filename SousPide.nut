// Adapted from https://github.com/br3ttb/Arduino-PID-Library
pid <- {
    p = 857 // Proportiona
    i = 0.5 // Integral
    d = 0.1 // Derivative

    target = 0 // Target temperature
    min = 0 // Minimum output value
    max = 100 // Maximum output value
    sampleTime = 1 // Time between samples (calls to compute) in seconds

    lastInput = 0
    errorSum = 0

    function compute(input) {
        local error = target - input
        local diff = input - lastInput

        lastInput = input
        errorSum = limit(errorSum + (i * sampleTime * error))

        return limit((p * error)  + errorSum + ((d / sampleTime) * diff))
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
