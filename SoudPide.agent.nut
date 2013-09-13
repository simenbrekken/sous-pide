class Firebase {
    url = null
    headers = {
        "Content-Type": "application/json"
    }

    constructor(url) {
        this.url = url
    }

    function read(callback) {
        http.get(url + ".json", headers).sendasync(function(res) {
            callback(http.jsondecode(res.body))
        })
    }

    function update(values, callback = null) {
        http.request("PATCH", url + ".json", headers, http.jsonencode(values)).sendasync(function(res) {
            if (callback) {
                callback(http.jsondecode(res.body))
            }
        })
    }

    function child(path) {
        return Firebase(url + "/" + path)
    }
}

local firebase = Firebase("https://sous-pide.firebaseio.com/devices/simen")
local configuration = firebase.child("configuration")
local values = firebase.child("values")

device.on("update", function(data) {
    values.update(data)
})

http.onrequest(function(req, res) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Content-Type", "application/json")

    if (req.path == "/update") {
        configuration.read(function(values) {
            device.send("configure", values)
            res.send(200, "OK")
        })
    }
})
