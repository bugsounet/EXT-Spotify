"use strict"

var NodeHelper = require("node_helper")
var logSpotify = (...args) => { /* do nothing */ }

const pm2 = require("pm2")
const systemd = require("systemd")
const spotify = require("./components/spotifyLibrary.js")

module.exports = NodeHelper.create({
  start: function () {
    
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[SPOTIFY] EXT-Spotify Version:", require('./package.json').version, "rev:", require('./package.json').rev)
        this.initialize(payload)
      break
      /** Spotify module **/
      case "SPOTIFY_RETRY_PLAY":
        clearTimeout(this.timeout)
        this.timeout= null
        clearTimeout(this.retry)
        this.retry = null
        this.retry = setTimeout(() => {
          this.spotify.play(payload, (code, error, result) => {
            if ((code == 404) && (result.error.reason == "NO_ACTIVE_DEVICE")) {
              logSpotify("[SPOTIFY] RETRY playing...")
              this.socketNotificationReceived("SPOTIFY_PLAY", payload)
            }
            if ((code !== 204) && (code !== 202)) {
              if (this.config.player.type == "Librespot") this.sendSocketNotification("WARNING", { message: "LibrespotNoResponse", values: this.config.deviceName })
              if (this.config.player.type == "Raspotify") this.sendSocketNotification("WARNING", { message: "RaspotifyNoResponse", values: this.config.deviceName })
              return console.log("[SPOTIFY:PLAY] RETRY Error", code, error, result)
            }
            else {
              logSpotify("[SPOTIFY] RETRY: DONE_PLAY")
              this.retryPlayerCount = 0
              if (this.config.player.type == "Librespot") this.sendSocketNotification("INFORMATION", { message: "LibrespotConnected", values: this.config.deviceName })
              if (this.config.player.type == "Raspotify") this.sendSocketNotification("INFORMATION", { message: "RaspotifyConnected", values: this.config.deviceName })
            }
          })
        }, 3000)
        break
      case "SPOTIFY_PLAY":
        this.spotify.play(payload, (code, error, result) => {
          clearTimeout(this.timeout)
          this.timeout= null
          if ((code == 404) && (result.error.reason == "NO_ACTIVE_DEVICE")) {
            this.retryPlayerCount++
            if (this.retryPlayerCount >= 4) return this.retryPlayerCount = 0
            if (this.config.player.type == "Librespot") {
              console.log("[SPOTIFY] No response from librespot !")
              this.sendSocketNotification("INFORMATION", { message: "LibrespotConnecting" })
              this.Librespot(true)
              this.timeout= setTimeout(() => {
                this.socketNotificationReceived("SPOTIFY_TRANSFER", this.config.deviceName)
                this.socketNotificationReceived("SPOTIFY_RETRY_PLAY", payload)
              }, 3000)
            }
            if (this.config.player.type == "Raspotify") {
              console.log("[SPOTIFY] No response from raspotify !")
              this.sendSocketNotification("INFORMATION", { message: "RaspotifyConnecting" })
              this.Raspotify(true)
              this.timeout= setTimeout(() => {
                this.socketNotificationReceived("SPOTIFY_TRANSFER", this.config.deviceName)
                this.socketNotificationReceived("SPOTIFY_RETRY_PLAY", payload)
              }, 3000)
            }
          }
          if ((code !== 204) && (code !== 202)) {
            return console.log("[SPOTIFY:PLAY] Error", code, result)
          }
          else {
            logSpotify("[SPOTIFY] DONE_PLAY")
            this.retryPlayerCount = 0
          }
        })
        break
      case "SPOTIFY_VOLUME":
        this.spotify.volume(payload, (code, error, result) => {
          if (code !== 204) console.log("[SPOTIFY:VOLUME] Error", code, result)
          else {
            this.sendSocketNotification("DONE_SPOTIFY_VOLUME", payload)
            logSpotify("[SPOTIFY] DONE_VOLUME:", payload)
          }
        })
        break
      case "SPOTIFY_PAUSE":
        this.spotify.pause((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:PAUSE] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_PAUSE")
        })
        break
      case "SPOTIFY_TRANSFER":
        this.spotify.transferByName(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:TRANSFER] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_TRANSFER")
        })
        break
      case "SPOTIFY_STOP":
        if (this.config.player.type == "Librespot") this.LibrespotRestart()
        if (this.config.player.type == "Raspotify") this.Raspotify(true)
        break
      case "SPOTIFY_NEXT":
        this.spotify.next((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:NEXT] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_NEXT")
        })
        break
      case "SPOTIFY_PREVIOUS":
        this.spotify.previous((code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:PREVIOUS] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_PREVIOUS")
        })
        break
      case "SPOTIFY_SHUFFLE":
        this.spotify.shuffle(payload,(code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:SHUFFLE] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_SHUFFLE")
        })
        break
      case "SPOTIFY_REPEAT":
        this.spotify.repeat(payload, (code, error, result) => {
          if ((code !== 204) && (code !== 202)) console.log("[SPOTIFY:REPEAT] Error", code, result)
          else logSpotify("[SPOTIFY] DONE_REPEAT")
        })
        break
      case "SEARCH_AND_PLAY":
        logSpotify("[SPOTIFY] Search and Play", payload)
        this.searchAndPlay(payload.query, payload.condition)
        break

    }
  },

  initialize: async function (config) {
    this.config = config
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args) }
    logSpotify("Starting Spotify module...")
    try {
      this.spotify = new spotify(this.config.visual,
        (noti, params) => {
          //console.log("SPOTIFY Noti:", noti, params)
          this.sendSocketNotification(noti, params)
        },
        this.config.debug
      )
      this.spotify.start()
    } catch (e) {
      console.log("[SPOTIFY] " + e)
      let error = "SPOTIFY: tokenSpotify.json file not found !"
      this.sendSocketNotification("WARNING" , {  message: error } )
    }
    if (this.config.player.type == "Librespot") {
      console.log("[SPOTIFY] Launch Librespot...")
      this.Librespot(true)
    } else if (this.config.player.type == "Raspotify") {
      this.raspotify = new systemd("raspotify")
      console.log("[SPOTIFY] Launch Raspotify...")
      this.Raspotify(true)
    }
    else { console.log("[SPOTIFY] No player activated.") }
  },

  /** launch librespot with pm2 **/
  Librespot: function(restart= false) {
    var file = "librespot"
    var filePath = path.resolve(__dirname, "components/librespot/target/release", file)
    var cacheDir = __dirname + "/components/librespot/cache"
    if (!fs.existsSync(filePath)) {
      console.log("[SPOTIFY] Librespot is not installed !")
      this.sendSocketNotification("WARNING" , { message: "LibrespotNoInstalled" })
      return
    }
    this.pm2.connect((err) => {
      if (err) return console.log(err)
      console.log("[SPOTIFY] ~PM2~ Connected!")
      this.pm2.list((err,list) => {
        if (err) return console.log(err)
        if (list && Object.keys(list).length > 0) {
          for (let [item, info] of Object.entries(list)) {
            if (info.name == "librespot" && info.pid) {
              let deleted = false
              if (restart) {
                this.pm2.delete("librespot" , (err) => {
                  if (err) console.log("[SPOTIFY] ~PM2~ Librespot Process not found")
                  else {
                    console.log("[SPOTIFY] ~PM2~ Librespot Process deleted! (refreshing ident)")
                    deleted= true
                    this.Librespot() // recreate process with new ident !
                  }
                })
              }
              if (deleted) return
              else return console.log("[SPOTIFY] ~PM2~ Librespot already launched")
            }
          }
        }
        this.pm2.start({
          script: filePath,
          name: "librespot",
          out_file: "/dev/null",
          args: [
            "-n", this.config.deviceName,
            "-u", this.config.player.email,
            "-p", this.config.player.password,
            "--initial-volume" , this.config.player.maxVolume,
            "-c", cacheDir
          ]
        }, (err, proc) => {
          if (err) {
            this.sendSocketNotification("WARNING" , { message: "LibrespotError", values: err.toString() })
            console.log("[SPOTIFY] ~Librespot~ " + err)
            return
          }
          console.log("[SPOTIFY] ~PM2~ Librespot started!")
        })
      })
    })
    process.on('exit', (code) => {
      // try to kill librespot on exit ... or not ...
      this.pm2.stop("librespot", (e,p) => {
        console.log("[SPOTIFY] ~Librespot~ Killed")
      })
    })
  },

  LibrespotRestart() {
    this.pm2.restart("librespot", (err, proc) => {
      if (err) console.log("[SPOTIFY] ~PM2~ Librespot error: " + err)
      else logSpotify("[SPOTIFY] ~PM2~ Restart Librespot")
    })
  },

  Raspotify: async function (force = false) {
    if (!this.raspotify) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyError", values: "systemd library error" })
      return console.log("[SPOTIFY] ~Raspotify~ systemd library error!")
    }
    const RaspotifyStatus = await this.raspotify.status()
    if (RaspotifyStatus.error) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyNoInstalled" })
      return console.error("[SPOTIFY] ~Raspotify~ Error: Raspotify is not installed!")
    }
    if (RaspotifyStatus.state == "running" && !force) return console.log("[SPOTIFY] ~Raspotify~ Already running")
    // restart respotify service
    console.log("[SPOTIFY] ~Raspotify~ Force Restart")

    const RaspotifyRestart = await this.raspotify.restart()
    if (RaspotifyRestart.error) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyError", values: "restart failed!" })
      console.log("[SPOTIFY] ~Raspotify~ Error on restart!")
    }
  },

  /** Spotify Search sub-function **/
  searchAndPlay: function (param, condition) {
    if (!param.type) {
      param.type = "artist,track,album,playlist"
    } else {
      param.type = param.type.replace(/\s/g, '')
    }
    if (!param.q) {
      param.q = "something cool"
    }
    var pickup = (items, random, retType) => {
      var ret = {}
      var r = (random)
        ? items[Math.floor(Math.random() * items.length)]
        : items[0]
        if (r.uri) {
          ret[retType] = (retType == "uris") ? [r.uri] : r.uri
          return ret
        } else {
          console.log("[SPOTIFY] Unplayable item: ", r)
          return false
      }
    }
    this.spotify.search(param, (code, error, result) => {
      var foundForPlay = null
      if (code == 200) { //When success
        const map = {
          "tracks": "uris",
          "artists": "context_uri",
          "albums": "context_uri",
          "playlists": "context_uri"
        }
        for (var section in map) {
          if (map.hasOwnProperty(section) && !foundForPlay) {
            var retType = map[section]
            if (result[section] && result[section].items.length > 1) {
              foundForPlay = pickup(result[section].items, condition.random, retType)
            }
          }
        }
        if (foundForPlay && condition.autoplay) {
          logSpotify("[SPOTIFY] Search and Play Result:", foundForPlay)
          this.socketNotificationReceived("SPOTIFY_PLAY", foundForPlay)
        } else {
          logSpotify("[SPOTIFY] Search and Play No Result")
          this.sendSocketNotification("WARNING" , { message: "SpotifyNoResult" })
        }
      } else { //when fail
        console.log("[SPOTIFY] Search and Play failed !")
        this.sendSocketNotification("WARNING" , { message: "SpotifySearchFailed" })
      }
    })
  },

  DisplayError: function (err, error, details = null) {
    if (details) console.log("[SPOTIFY][ERROR]" + err, details.message, details)
    else console.log("[SPOTIFY][ERROR]" + err)
    return this.sendSocketNotification("NOT_INITIALIZED", { message: error.message, values: error.values })
  },

})
