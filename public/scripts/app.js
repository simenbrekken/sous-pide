/* global Firebase: false, sprintf: false */

(function() {
    var $document = $(document)

    var firebase = new Firebase('https://sous-pide.firebaseio.com'),
        device = firebase.child('devices/simen')

    // Detect touch
    $('html').toggleClass('no-touch', !('ontouchstart' in document.documentElement));

    // Values
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

    // Steppers
    $('.stepper[data-path]').each(function() {
        var $stepper = $(this)

        var path = $stepper.attr('data-path'),
            step = +$stepper.attr('data-step') || 1,
            node = device.child(path),
            value = 0

        node.once('value', function(snapshot) {
            value = +snapshot.val() || 0
        })

        $stepper.on('mousedown touchstart', '.button', function(e) {
            e.preventDefault()

            var $button = $(e.target)

            var startTime = Date.now(),
                direction = $button.hasClass('plus') ? 1 : -1,
                timer

            function adjust() {
                value += step * direction

                node.set(value)
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
}())
