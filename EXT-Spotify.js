/**
 ** Module : EXT-Spotify
 ** @bugsounet
 ** ©01/2022
 ** support: http://forum.bugsounet.fr
 **/

logSpotify = (...args) => { /* do nothing */ }

Module.register("EXT-Spotify", {
  defaults: {
    debug: true,
    deviceName: "MagicMirror",
    visual: {
      updateInterval: 1000,
      idleInterval: 10000,
      useBottomBar: false,
      PATH: "../../../", // Needed Don't modify it !
      TOKEN: "tokenSpotify.json",
      CLIENT_ID: "",
      CLIENT_SECRET: "",
    },
    player: {
      type: "none",
      email: "",
      password: "",
      minVolume: 10,
      maxVolume: 90,
      usePause: true
    }
  },

  start: function () {
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args) }
    this.spotify= {
      connected: false,
      player: false,
      currentVolume: 0,
      targetVolume: this.config.player.maxVolume,
      repeat: null,
      shuffle: null,
      forceVolume: false
    }
    this.assistantSpeak= false
    var callbacks = {
      "spotifyStatus": (status) => {
        if (status) {
          /** Spotify active **/
          this.spotify.connected = true
          this.sendNotification("EXT_SPOTIFY_CONNECTED")
        } else {
          /** Spotify inactive **/
          this.sendNotification("EXT_SPOTIFY_DISCONNECTED")
          this.spotify.connected = false
          logSpotify("spotifyStatus: PLAYER Disconnected")
          this.sendNotification("EXT_SPOTIFY_PLAYER-DISCONNECTED")
          this.spotify.player = false
        }
      }
    }
    this.config.visual.deviceDisplay = "En écoute sur:" //this.translate("SpotifyListenText")
    this.Spotify = new Spotify(this.config.visual, callbacks, this.config.debug)
  },

  getScripts: function() {
    return [
      "/modules/EXT-Spotify/components/spotifyClass.js",
      "https://cdn.materialdesignicons.com/5.2.45/css/materialdesignicons.min.css"
    ]
  },

  getStyles: function () {
    return [
      "EXT-Spotify.css",
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    ]
  },

  getDom: function() {
    /** Create Spotify **/
    if (!this.config.visual.useBottomBar) {
      return this.Spotify.prepareMini()
    } else {
      var dom = document.createElement("div")
      dom.style.display = 'none'
      return dom
    }
  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        if (this.config.visual.useBottomBar) this.Spotify.prepare()
        this.sendNotification("EXT_HELLO", this.name)
        break
      case "ASSISTANT_LISTEN":
      case "ASSISTANT_THINK":
      case "ASSISTANT_REPLY":
      case "ASSISTANT_CONTINUE":
      case "ASSISTANT_CONFIRMATION":
      case "ASSISTANT_ERROR":
        this.assistantSpeak= true
        break
      case "ASSISTANT_HOOK":
      case "ASSISTANT_STANDBY":
        this.assistantSpeak= false
        break
      case "EXT_SPOTIFY_VOLUME_MIN":
        if (!this.spotify.player) return
        if (this.spotify.currentVolume <= this.config.player.minVolume) return
        this.spotify.targetVolume = this.spotify.currentVolume
        this.sendSocketNotification("SPOTIFY_VOLUME", this.config.player.minVolume)
        break
      case "EXT_SPOTIFY_VOLUME_MAX":
        if (!this.spotify.player) return
        if (!this.spotify.forceVolume && (this.spotify.targetVolume <= this.config.player.minVolume)) return
        this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume)
        break
      case "EXT_SPOTIFY_VOLUME":
      case "EXT_SPOTIFY_VOLUME_SET":
        if (!this.spotify.player || !payload) return
        if (isNaN(payload)) return console.log("[SPOTIFY] Volume Must be a number ! [0-100]")
        if (payload > 100) payload = 100
        if (payload < 0) payload = 0
        console.log("[SPOTIFY] Volume: " + payload)
        this.spotify.targetVolume = payload
        if (this.assistantSpeak) this.spotify.forceVolume = true
        else {
          this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume)
          this.spotify.forceVolume = false
        }
        break
      case "EXT_SPOTIFY_PLAY":
        this.SpotifyCommand("PLAY")
        break
      case "EXT_SPOTIFY_PAUSE":
        this.SpotifyCommand("PAUSE")
        break
      case "EXT_STOP":
      case "EXT_SPOTIFY_STOP":
        this.SpotifyCommand("STOP")
        break
      case "EXT_SPOTIFY_NEXT":
        this.SpotifyCommand("NEXT")
        break
      case "EXT_SPOTIFY_PREVIOUS":
        this.SpotifyCommand("PREVIOUS")
        break
      case "EXT_SPOTIFY_SHUFFLE":
        this.SpotifyCommand("SHUFFLE")
        break
      case "EXT_SPOTIFY_REPEAT":
        this.SpotifyCommand("REPEAT")
        break
      case "EXT_SPOTIFY_TRANSFER":
        this.SpotifyCommand("TRANSFER")
        break
      case "EXT_SPOTIFY_SEARCH":
        this.SpotifyCommand("SEARCH", payload)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      /** Spotify module **/
      case "SPOTIFY_PLAY":
        this.Spotify.updateCurrentSpotify(payload)
        if (!this.spotify.connected) return // don't check if not connected (use spotify callback)
        if (payload && payload.device && payload.device.name) {
          this.spotify.repeat = payload.repeat_state
          this.spotify.shuffle = payload.shuffle_state

          if (payload.device.name == this.config.deviceName) {
            this.spotify.currentVolume = payload.device.volume_percent
            if (!this.spotify.player) {
              this.spotify.player = true
              logSpotify("SPOTIFY_PLAY: PLAYER Connected")
              this.sendNotification("EXT_SPOTIFY_PLAYER-CONNECTED")
            }
          }
          else {
            if (this.spotify.player) {
              this.spotify.player = false
              logSpotify("SPOTIFY_PLAY: PLAYER Disconnected")
              this.sendNotification("EXT_SPOTIFY_PLAYER-DISCONNECTED")
            }
          }
        }
        break
      case "SPOTIFY_IDLE":
        this.Spotify.updatePlayback(false)
        this.spotify.player = false
        break
      case "DONE_SPOTIFY_VOLUME":
        logSpotify("Volume done:", payload)
        break
    }
  },

  resume: function() {
    if (this.spotify.connected && this.config.visual.useBottomBar) {
      this.showSpotify()
      logSpotify("Spotify is resumed.")
    }
  },

  suspend: function() {
    if (this.spotify.connected && this.config.visual.useBottomBar) {
      this.hideSpotify()
      logSpotify("Spotify is suspended.")
    }
  },

  hideSpotify: function() {
    var spotifyModule = document.getElementById("module_EXT_Spotify")
    var dom = document.getElementById("EXT_SPOTIFY")
    this.timer = null
    clearTimeout(this.timer)
    dom.classList.remove("bottomIn")
    dom.classList.add("bottomOut")
    this.timer = setTimeout(() => {
      dom.classList.add("inactive")
      spotifyModule.style.display = "none"
    }, 500)
  },

  showSpotify: function() {
    var spotifyModule = document.getElementById("module_EXT_Spotify")
    var dom = document.getElementById("EXT_SPOTIFY")
    spotifyModule.style.display = "block"
    dom.classList.remove("bottomOut")
    dom.classList.add("bottomIn")
    dom.classList.remove("inactive")
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/
  getCommands: function(commander) {
    commander.add({
      command: "spotify",
      description: "Spotify commands",
      callback: "tbSpotify"
    })
  },

  tbSpotify: function(command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ")
      var params = handler.args.split(" ")
      if (args[0] == "play") {
        handler.reply("TEXT", "Spotify PLAY")
        this.SpotifyCommand("PLAY")
      }
      if (args[0] == "pause") {
        handler.reply("TEXT", "Spotify PAUSE")
        this.SpotifyCommand("PAUSE")
      }
      if (args[0] == "stop") {
        handler.reply("TEXT", "Spotify STOP")
        this.SpotifyCommand("STOP")
      }
      if (args[0] == "next") {
        handler.reply("TEXT", "Spotify NEXT")
        this.SpotifyCommand("NEXT")
      }
      if (args[0] == "previous") {
        handler.reply("TEXT", "Spotify PREVIOUS")
        this.SpotifyCommand("PREVIOUS")
      }
      if (args[0] == "volume") {
        if (args[1]) {
          if (isNaN(args[1])) return handler.reply("TEXT", "Must be a number ! [0-100]")
          if (args[1] > 100) args[1] = 100
          if (args[1] < 0) args[1] = 0
          handler.reply("TEXT", "Spotify VOLUME: " + args[1])
          this.SpotifyCommand("VOLUME", args[1])
        } else handler.reply("TEXT", "Define volume [0-100]")
      }
      if (args[0] == "to") {
        if (args[1]) {
          handler.reply("TEXT", "Spotify TRANSFER to: " + params[1] + " (if exist !)")
          this.SpotifyCommand("TRANSFER", params[1])
        }
        else handler.reply("TEXT", "Define the device name (case sensitive)")
      }
    } else {
      handler.reply("TEXT", 'Need Help for /spotify commands ?\n\n\
  *play*: Launch music (last title)\n\
  *pause*: Pause music\n\
  *stop*: Stop music\n\
  *next*: Next track\n\
  *previous*: Previous track\n\
  *volume*: Volume control, it need a value 0-100\n\
  *to*: Transfert music to another device (case sensitive)\
  ',{parse_mode:'Markdown'})
    }
  },

  /** Spotify commands **/
  SpotifyCommand: function(command, payload) {
    switch (command) {
      case "PLAY":
        this.sendSocketNotification("SPOTIFY_PLAY")
        break
      case "PAUSE":
        this.sendSocketNotification("SPOTIFY_PAUSE")
        break
      case "STOP":
        if (!this.spotify.connected) return // don't force to stop if no device play...
        if (this.spotify.player) this.sendSocketNotification("SPOTIFY_STOP")
        else this.sendSocketNotification("SPOTIFY_PAUSE")
        break
      case "NEXT":
        this.sendSocketNotification("SPOTIFY_NEXT")
        break
      case "PREVIOUS":
        this.sendSocketNotification("SPOTIFY_PREVIOUS")
        break
      case "SHUFFLE":
        this.sendSocketNotification("SPOTIFY_SHUFFLE", !this.spotify.shuffle)
        break
      case "REPEAT":
        this.sendSocketNotification("SPOTIFY_REPEAT", (this.spotify.repeat == "off" ? "track" : "off"))
        break
      case "TRANSFER":
        this.sendSocketNotification("SPOTIFY_TRANSFER", payload)
        break
      case "VOLUME":
        this.notificationReceived("EXT_SPOTIFY_VOLUME_SET", payload)
        break
      case "SEARCH":
        /** enforce type **/
        var searchType = payload.query.split(" ")
        var type = null
        if (searchType[0] == this.translate("SpotifySearchTypePlaylist")) type = "playlist"
        else if (searchType[0] == this.translate("SpotifySearchTypeAlbum")) type= "album"
        else if (searchType[0] == this.translate("SpotifySearchTypeTrack")) type= "track"
        else if (searchType[0] == this.translate("SpotifySearchTypeArtist")) type= "artist"
        if (type) {
          payload.query = payload.query.replace(searchType[0] + " ","")
          payload.type = type
        }
        var pl = {
          query: {
            q: payload.query,
            type: payload.type,
          },
          condition: {
            random: payload.random,
            autoplay: true,
          }
        }
        this.sendSocketNotification("SEARCH_AND_PLAY", pl)
        break
    }
  }
})
