/* global sprintf: false */

(function() {
    var $document = $(document)

    var agentUrl = 'https://agent.electricimp.com/zOU4EXiahz2t',
        resumeTimer,
        updateTimer

    function pauseUpdates() {
        console.log('Pausing updates')
        clearTimeout(updateTimer)
        clearTimeout(resumeTimer)

        updateTimer = null
        resumeTimer = null
    }

    function resumeUpdates() {
        clearTimeout(updateTimer)
        clearTimeout(resumeTimer)

        resumeTimer = setTimeout(function() {
            console.log('Resuming updates')

            updateTimer = setInterval(load() || load, 1000)
        }, 750)
    }

    function update(data) {
        if (updateTimer) {
            console.log('Updating')

            $('[data-path]').each(function() {
                var $el = $(this)

                var segments = $el.attr('data-path').split('/'),
                    value = data[segments[0]][segments[1]]

                if ($el.hasClass('value')) {
                    $el.text(sprintf($el.attr('data-format') || '%.1f', value))
                } else if ($el.hasClass('stepper')) {
                    $el.attr('data-value', value || 0)
                }
            })
        }
    }

    // Load configuration from agent
    function load() {
        console.log('Loading')
        $.get(agentUrl).done(update)
    }

    // Save configuration to agent (maximum once every 750ms)
    var save = _.throttle(function() {
        var config = {}

        $('[data-path^="config/"]').each(function() {
            var $el = $(this)

            var segments = $el.attr('data-path').split('/')

            config[segments[1]] = $el.attr('data-value')
        })

        $.post(agentUrl, config)
    }, 750)

    // Stepper
    $('.stepper').each(function() {
        var $stepper = $(this)

        var step = +$stepper.attr('data-step') || 1

        $stepper.on('mousedown touchstart', '.button', function(e) {
            e.preventDefault()

            var $button = $(e.target)

            var startTime = Date.now(),
                direction = $button.hasClass('plus') ? 1 : -1,
                holdTimer

            function adjust() {
                var value = (+$stepper.attr('data-value') || 0) + (step * direction)

                $stepper.attr('data-value', value).trigger('change', value)
            }

            function delay(amount) {
                clearTimeout(holdTimer)

                holdTimer = setTimeout(function() {
                    adjust()
                    delay(Math.max(100, amount * 0.75))
                }, amount)
            }

            $button.addClass('active')

            $document.one('mouseup touchend', function(e) {
                e.preventDefault()

                $button.removeClass('active')

                if (Date.now() - startTime  < 250) {
                    adjust()
                }

                clearTimeout(holdTimer)
                resumeUpdates()
            })

            pauseUpdates()
            delay(500)
        })
    })

    // Configuration stepper
    $('.stepper[data-path]').on('change', function(e, value) {
        var $value = $('.value[data-path="' + $(this).attr('data-path') + '"]')
        $value.text(sprintf($value.attr('data-format') || '%.1f', value))

        save()
    })

    // Timer
    /*
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
            })
        })
    })
    */

    // Detect touch
    $('html').toggleClass('no-touch', !('ontouchstart' in document.documentElement))

    load()
    resumeUpdates()
}())
