// Adapted from https://github.com/br3ttb/Arduino-PID-Library
function PID(p, i, d, sampleTime, min, max) {
    this.target = 0
    this.output = 0
    this.min = min || 0
    this.max = max || 100

    this.errorSum = 0
    this.lastInput = 0
    this.lastTime = 0

    this.setTunings(p, i, d)
    this.setSampleTime(sampleTime)
}

PID.prototype.setTunings = function(p, i, d) {
    var ratio = this.sampleTime / 1000

    this.p = p
    this.i = i * ratio
    this.d = d / ratio
}

PID.prototype.setSampleTime = function(sampleTime) {
    var ratio = sampleTime / this.sampleTime

    this.i *= ratio
    this.d /= ratio
    this.sampleTime = sampleTime
}

PID.prototype.compute = function(input) {
    var now = Date.now(),
        timeDiff = now - this.lastTime

    if (timeDiff >= this.sampleTime) {
        var error = this.target - input,
            inputDiff = input - this.lastInput

        this.errorSum = Math.max(this.min, Math.min(this.max, this.errorSum + (this.i * error)))
        this.output = Math.max(this.min, Math.min(this.max, (this.p * error) + this.errorSum - (this.d * inputDiff)))
        this.lastInput = input
        this.lastTime = now
    }

    return this.output
}

module.exports = PID
