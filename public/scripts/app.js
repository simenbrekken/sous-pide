/* global Firebase: false, sprintf: false */

(function() {
    var $document = $(document)

    var firebase = new Firebase('https://sous-pide.firebaseio.com'),
        device = firebase.child('devices/simen')

    // Notify agent when data needs to be retrieved via Firebase's REST API
    var notifyAgent = (function() {
        var promise

        return function() {
            if (!promise) {
                promise = $.Deferred()

                device.child('configuration/agent').once('value', function(snapshot) {
                    promise.resolve('https://agent.electricimp.com/' + snapshot.val() + '/update')
                })
            }

            promise.done(function(url) {
                console.log('Polling url:', url)
            })

            return promise.done(_.throttle($.get, 500))
        }
    }())

    // Detect touch
    $('html').toggleClass('no-touch', !('ontouchstart' in document.documentElement))

    // Reading
    $('.reading[data-path]').each(function() {
        var $reading = $(this),
            $value = $reading.find('.value')

        var path = $reading.attr('data-path'),
            format = $value.attr('data-format') || '%.1f',
            node = device.child(path),
            value

        node.on('value', function(snapshot) {
            var previousValue = value

            value = +snapshot.val()

            $value.text(sprintf(format, value))
            $reading.toggleClass('rising', value > previousValue).toggleClass('falling', value < previousValue)
        })
    })

    // Stepper
    $('.stepper').each(function() {
        var $stepper = $(this)

        var path = $stepper.attr('data-path'),
            node = device.child(path),
            step = +$stepper.attr('data-step') || 1,
            value

        node.on('value', function(snapshot) {
            value = snapshot.val() || 0
        })

        $stepper.on('mousedown touchstart', '.button', function(e) {
            e.preventDefault()

            var $button = $(e.target)

            var startTime = Date.now(),
                direction = $button.hasClass('plus') ? 1 : -1,
                timer

            function adjust() {
                var previousValue = value

                node.set(Math.max(0, value + step * direction))

                if (value != previousValue) {
                    notifyAgent()
                }
            }

            function delay(amount) {
                clearTimeout(timer)

                timer = setTimeout(function() {
                    adjust()
                    delay(Math.max(100, amount * 0.75))
                }, amount)
            }

            $document.one('mouseup touchend', function(e) {
                e.preventDefault()

                $button.removeClass('active')

                clearTimeout(timer)

                // Handle regular clicks
                if (Date.now() - startTime  < 250) {
                    adjust()
                }
            })

            $button.addClass('active')

            // Delay 0.5s before button is considered held down
            delay(500)
        })
    })

    // Timer
    $('.timer').each(function() {
        var $timer = $(this),
            $hours = $timer.find('.hours .value'),
            $minutes = $timer.find('.minutes .value')

        var path = $timer.attr('data-path'),
            node = device.child(path),
            alarm = $timer.find('.alarm-sound')[0],
            duration = 0,
            startTime,
            updateTimer

        function update() {
            var diff = startTime ? Date.now() - startTime : 0,
                seconds = Math.max(0, duration - (diff / 1000)),
                hours = Math.floor(seconds / 3600),
                minutes = Math.ceil(seconds % 3600 / 60),
                active = startTime > 0 && seconds > 0,
                expired = startTime > 0 && seconds === 0

            // console.log('Updating timer, startTime: %d, duration: %d, seconds: %d, diff: %d', startTime, duration, seconds, diff)

            $hours.text(sprintf('%02d', hours))
            $minutes.text(sprintf('%02d', minutes))
            $timer.toggleClass('active', active).toggleClass('expired', expired)

            clearTimeout(updateTimer)

            if (active) {
                updateTimer = setTimeout(update, 1000 - diff % 1000)
            }

            // Update alarm
            expired ? alarm.play() : alarm.pause()

            // TODO: Notify device to stop when timer expires
        }

        node.child('duration').on('value', function(snapshot) {
            duration = snapshot.val() || 0

            update()
        })

        node.child('start').on('value', function(snapshot) {
            startTime = snapshot.val()

            update()
        })

        $timer.find('.toggle').on('click', function() {
            var start = node.child('start')
            start.once('value', function(snapshot) {
                start.set(snapshot.val() ? null : Date.now())
            })
        })
    })
}())
