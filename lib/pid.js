// Adapted from https://github.com/br3ttb/Arduino-PID-Library
function PID() {
    this.target = 0
    this.output = 0
    this.min = 0
    this.max = 100
    this.sampleTime = 100

    this.errorSum = 0
    this.lastInput = 0
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

PID.prototype.setOutputLimits = function(min, max) {
    this.min = min
    this.max = max
}

PID.prototype.compute = function(input) {
    var error = this.target - input,
        inputDiff = input - this.lastInput

    this.errorSum = Math.max(this.min, Math.min(this.max, this.errorSum + (this.i * error)))
    this.output = Math.max(this.min, Math.min(this.max, (this.p * error) + this.errorSum - (this.d * inputDiff)))
    this.lastInput = input

    return this.output
}

module.exports = PID

var pid = new PID()
pid.setOutputLimits(0, 5000)
pid.setTunings(2, 0.5, 2)

pid.target = 55

console.log(pid.compute(52))
