/* global Firebase: false, sprintf: false */

(function() {
    var $document = $(document)

    var firebase = new Firebase('https://sous-pide.firebaseio.com'),
        device = firebase.child('devices/simen')

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

    // Bound value
    $('.value[data-path]').each(function() {
        var $value = $(this)

        var path = $value.attr('data-path'),
            format = $value.attr('data-format') || '%.1f',
            node = device.child(path)

        node.on('value', function(snapshot) {
            var value = +snapshot.val()

            $value.text(sprintf(format, value))
        })
    })

    // Stepper
    $('.stepper').each(function() {
        var $stepper = $(this)

        var step = +$stepper.attr('data-step') || 1
        $stepper.on('mousedown touchstart', '.button', function(e) {
            e.preventDefault()

            var $button = $(e.target)

            var startTime = Date.now(),
                direction = $button.hasClass('plus') ? 1 : -1,
                timer

            function adjust() {
                var value = (+$stepper.attr('data-value') || 0) + (step * direction)

                $stepper.attr('data-value', value).trigger('change', value)
            }

            function delay(amount) {
                clearTimeout(timer)

                timer = setTimeout(function() {
                    adjust()
                    delay(Math.max(100, amount * 0.75))
                }, amount)
            }

            $button.addClass('active')

            $document.one('mouseup touchend', function(e) {
                e.preventDefault()

                $button.removeClass('active')

                clearTimeout(timer)

                if (Date.now() - startTime  < 250) {
                    adjust()
                }
            })

            delay(500)
        })
    })

    // Bound stepper
    $('.stepper[data-path]').each(function() {
        var $stepper = $(this)

        var path = $stepper.attr('data-path'),
            node = device.child(path)

        node.on('value', function(snapshot) {
            $stepper.attr('data-value', snapshot.val() || 0)
        })

        $stepper.on('change', function(e, value) {
            node.set(value)
            notifyAgent()
        })
    })

    // Timer
    $('.timer').each(function() {
        var $timer = $(this),
            $hours = $timer.find('.hours .value'),
            $minutes = $timer.find('.minutes .value')

        var path = $timer.attr('data-path'),
            node = device.child(path)

        node.child('duration').on('value', function(snapshot) {
            var seconds = snapshot.val() || 0,
                hours = Math.floor(seconds / 3600),
                minutes = Math.floor(seconds % 3600 / 60)

            $hours.text(sprintf('%02d', hours))
            $minutes.text(sprintf('%02d', minutes))
        })

        node.child('start').on('value', function(snapshot) {
            $timer.toggleClass('active', !!snapshot.val())
        })

        $timer.find('.toggle').on('click', function() {
            var start = node.child('start')
            start.once('value', function(snapshot) {
                start.set(snapshot.val() ? null : Date.now())
                notifyAgent()
            })
        })
    })
}())
