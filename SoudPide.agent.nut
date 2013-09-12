config <- server.load()
values <- {}

configure <- function() {
    server.save(config)
    device.send("configure", config)
}

device.on("update", function(data) {
    values = data
})

http.onrequest(function(req, res) {
    if (req.method == "POST") {
        foreach (name, value in http.urldecode(req.body)) {
            config[name] <- value.tofloat()
        }

        configure()
    }

    res.header("Access-Control-Allow-Origin", "*")
    res.header("Content-Type", "application/json")
    res.send(200, http.jsonencode({
        config = config
        values = values
    }))
})
