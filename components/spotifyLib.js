//
// Spotify library
// Developers : Seongnoh Sean Yi (eouia0819@gmail.com)
//              bugsounet (bugsounet@bugsounet.fr)

const fs = require("fs")
const path = require("path")
const express = require("express")
const app = express()
const moment = require("moment")
var _Debug = (...args) => { /* do nothing */ }

class Spotify {
  constructor(config, callback, debug = false, first = false, SCL = false) {
    this.notification = callback
    this.default = {
      CLIENT_ID: "",
      CLIENT_SECRET: "",
      AUTH_DOMAIN: "http://localhost",
      AUTH_PATH: "/callback",
      AUTH_PORT: "8888",
      SCOPE: "user-read-private app-remote-control playlist-read-private streaming user-read-playback-state user-modify-playback-state",
      TOKEN: "./token.json",
      PATH: "../",
      updateInterval: 1000
    }
    this.retryTimer = null
    this.timer = null
    this.token = null
    this.setup = first
    this.SCL = SCL
    this.config = Object.assign({}, this.default, config)
    if (debug) _Debug = (...args) => { console.log("[SPOTIFY]", ...args) }

    this.authorizationSeed = 'Basic ' + (
      Buffer.from(
        this.config.CLIENT_ID + ':' + this.config.CLIENT_SECRET
      ).toString('base64')
    )
    this.initFromToken()
    _Debug("Spotify library Initialized...")
  }

  async pulse() {
    let idle = false
    try {
      let result = await this.updateSpotify(this.config)
      this.notification("SPOTIFY_PLAY", result)
    } catch (e) {
      idle = true
      if (e) console.log("[SPOTIFY:ERROR]", e)
      this.notification("SPOTIFY_IDLE")
    }
    this.timer = setTimeout(() => {
      this.pulse()
    }, idle ? this.config.idleInterval : this.config.updateInterval)
  }

  start() {
    _Debug("Started...")
    this.pulse()
  }
    
  stop() {
    clearTimeout(this.timer)
    this.timer = null
    clearTimeout(this.retryTimer)
    this.retryTimer = null
    _Debug("Stop")
  }

  updateDeviceList() {
    this.getDevices((code, error, result) => {
      if (result === "undefined" || code !== 200) {
        console.log("[SPOTIFY:DEVICE LIST] Error", code, result)
      } else {
        _Debug("[DEVICE LIST]", result)
        this.notification("SPOTIFY_DEVICELIST", result)
      }
    })
  }
    
  updateSpotify(spotify) {
    return new Promise((resolve, reject) => {
      this.getCurrentPlayback((code, error, result) => {
        if (result === "undefined" || code !== 200) {
          reject()
        } else {
          resolve(result)
        }
      })
    })
  }

  writeToken(output, cb = null) {
    var token = Object.assign({}, output)
    token.expires_at = Date.now() + ((token.expires_in - 60) * 1000)
    this.token = token
    var file = path.resolve(__dirname, this.config.PATH + this.config.TOKEN)
    fs.writeFileSync(file, JSON.stringify(token))
    _Debug("Token is written...")
    _Debug("Token expire", moment(this.token.expires_at).format("LLLL"))
    if (cb) cb()
  }

  initFromToken() {
    var file = path.resolve(__dirname, this.config.PATH + this.config.TOKEN)
    if (fs.existsSync(file)) {
      this.token = JSON.parse(fs.readFileSync(file))
    }
    else {
      if (!this.setup) throw Error("[SPOTIFY:ERROR] Token not found in " + file)
    }
  }

  isExpired() {
    return (Date.now() >= this.token.expires_at)
  }

  refreshToken(cb = null) {
    _Debug("Token refreshing...")
    var refresh_token = this.token.refresh_token
    let data = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token
    })

    var authOptions = {
      method: "POST",
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded',
        'Authorization': this.authorizationSeed
      },
      body: data.toString()
    }

    fetch('https://accounts.spotify.com/api/token', authOptions)
      .then(response => response.json())
      .then(data => {
        if (data.error) console.error("[SPOTIFY:ERROR] Token refreshing failed:", data)
        else {
          data.refresh_token = this.token.refresh_token
          this.writeToken(data, cb)
        }
      })
      .catch(error => {
        console.error("[SPOTIFY:ERROR] Token refreshing failed:", error)
      })
  }

  accessToken() {
    return (this.token.access_token) ? this.token.access_token : null
  }

  doRequest(api, type, qsParam, bodyParam, cb) {
    if (!this.token) {
      console.log("[SPOTIFY:ERROR] Token Error !", this.config.TOKEN)
      return
    }
    let url = "https://api.spotify.com" + api
    var authOptions = {
      method: type,
      headers: {
        'Authorization': "Bearer " + this.token.access_token
      },
    }
    if (bodyParam) authOptions.body = bodyParam
    if (qsParam) {
      let Params = new URLSearchParams(qsParam)
      url = url + "/?" + Params
    }
    _Debug("--->", url)

    var req = () => {
      let status = null
      fetch(url, authOptions)
        .then(response => {
          status = response.status
          if (status != 200) throw new Error(status)
          return response.json()
        })
        .then(data => {
          _Debug("Status:", status)
          if (api !== "/v1/me/player" && type !== "GET") _Debug("API Requested:", api)
          if (cb) cb(status, null, data)
        })
        .catch (error => { // /!\ to MIGRATE !!!
          _Debug("API Request fail on :", api, error.toString())
          if (cb) {
            /*
            if (error.response) {
              if (error.response.status == 404 && error.response.data) {
                return cb(error.response.status, null, error.response.data)
              }
            }
            */
            _Debug("Retry in 5 sec...")
            this.retryTimer = setTimeout(() => { cb("400", error, null) }, 5000)
          }
        })
    }

    if (this.isExpired()) {
      this.refreshToken(req)
    } else {
      req()
    }
  }

  getCurrentPlayback(cb) {
    var params = {
      'additional_types': 'episode,track'
    }
    this.doRequest("/v1/me/player", "GET", params, null, cb)
  }

  getDevices(cb) {
    this.doRequest("/v1/me/player/devices", "GET", null, null, cb)
  }

  play(param, cb) {
    this.doRequest("/v1/me/player/play", "PUT", null, param, cb)
  }

  pause(cb) {
    this.doRequest("/v1/me/player/pause", "PUT", null, null, cb)
  }

  next(cb) {
    this.doRequest("/v1/me/player/next", "POST", null, null, cb)
  }

  previous(cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: 0 }, null, (code, error, body) => {
      this.doRequest("/v1/me/player/previous", "POST", null, null, cb)
    })
  }

  seek(position,cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: position }, null, cb)
  }

  search(param, cb) {
    param.limit = 50
    this.doRequest("/v1/search", "GET", param, null, cb)
  }

  transfer(req, cb) {
    if (req.device_ids.length > 1) {
      req.device_ids = [req.device_ids[0]]
    }
    this.doRequest("/v1/me/player", "PUT", null, req, cb)
  }

  transferByName(device_name, cb) {
    this.getDevices((code, error, result) => {
      if (code == 200) {
        let devices = result.devices
        for (let i = 0; i < devices.length; i++) {
          if (devices[i].name == device_name) {
            this.transfer({ device_ids: [devices[i].id] }, cb)
            return
          }
        }
      } else {
        cb(code, error, result)
      }
    })
  }

  transferById(device, cb) {
    this.transfer({ device_ids: [device] }, cb)
  }

  volume(volume = 50, cb) {
    this.doRequest("/v1/me/player/volume", "PUT", { volume_percent: volume }, null, cb)
  }

  repeat(state, cb) {
    this.doRequest("/v1/me/player/repeat", "PUT", { state: state }, null, cb)
  }

  shuffle(state, cb) {
    this.doRequest("/v1/me/player/shuffle", "PUT", { state: state }, null, cb)
  }

  replay(cb) {
    this.doRequest("/v1/me/player/seek", "PUT", { position_ms: 0 }, null, cb)
  }

  async authFlow(afterCallback = () => {}, err = () => {}) {
    var redirect_uri = this.config.AUTH_DOMAIN + ":" + this.config.AUTH_PORT + this.config.AUTH_PATH

    if (!this.config.CLIENT_ID) {
      let msg = "[SPOTIFY_AUTH] CLIENT_ID doesn't exist."
      err(msg)
      return
    }

    if (this.token) {
      let msg = "[SPOTIFY_AUTH] You already have a token. no need to auth."
      err(msg)
      return
    }

    let server = app.get(this.config.AUTH_PATH, (req, res) => {
      let code = req.query.code || null
      let data = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      })
      let authOptions ={
        method: "POST",
        body: data.toString(),
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded',
          "Authorization": this.authorizationSeed
        }
      }
      fetch("https://accounts.spotify.com/api/token", authOptions)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error("[SPOTIFY_AUTH] Error ", data)
            server.close()
            res.send(`Error: ${data.error_description}`)
            throw new Error(data.error_description)
          }
          this.writeToken(data)
          server.close()
          res.send(`${this.config.TOKEN} would be created. Check it`)
          afterCallback()
        })
        .catch (error => {
          err("[SPOTIFY_AUTH] Error in request")
        })
    }).listen(this.config.AUTH_PORT)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.CLIENT_ID,
      scope: this.config.SCOPE,
      redirect_uri: redirect_uri,
      state: Date.now(),
      show_dialog: true
    })

    let url = "https://accounts.spotify.com/authorize?" + params

    const open = await loadOpen()
    console.log("[SPOTIFY_AUTH] Opening the browser for authentication on Spotify...")
    open(url).catch(() => {
      console.log('[SPOTIFY_AUTH] Failed to automatically open the URL. Copy/paste this in your browser:\n', url)
    })
  }
}

// import Open library and use default function only
async function loadOpen() {
  const loaded = await import('open');
  return loaded.default;
};

module.exports = Spotify
