/**
 ** Module : EXT-Spotify
 ** @bugsounet
 ** ©03/2022
 ** support: https://forum.bugsounet.fr
 **/

logSpotify = (...args) => { /* do nothing */ }

Module.register("EXT-Spotify", {
  defaults: {
    debug: true,
    updateInterval: 1000,
    idleInterval: 10000,
    useBottomBar: false,
    CLIENT_ID: "",
    CLIENT_SECRET: ""
  },

  start: function () {
    if (this.config.debug) logSpotify = (...args) => { console.log("[SPOTIFY]", ...args) }
    /** make default config **/
    this.Player= {
      usePlayer: false,
      deviceName: "MagicMirror",
      minVolume: 30,
      maxVolume: 100
    }
    this.Visual = {
      updateInterval: this.config.updateInterval,
      idleInterval: this.config.idleInterval,
      useBottomBar: this.config.useBottomBar,
      PATH: "../",
      TOKEN: "tokenSpotify.json",
      CLIENT_ID: this.config.CLIENT_ID,
      CLIENT_SECRET: this.config.CLIENT_SECRET
    }
    /** Search player **/
    let Librespot = config.modules.find(m => m.module == "EXT-Librespot")
    let Raspotify = config.modules.find(m => m.module == "EXT-Raspotify")
    if ((Librespot && !Librespot.disabled) || (Raspotify && !Raspotify.disabled)) {
      this.Player.usePlayer = true
      logSpotify("Player Found!")
      if (Librespot) {
        try {
          this.Player.minVolume = Librespot.config.minVolume ? Librespot.config.minVolume : 30
        } catch (e) { }
        try {
          this.Player.maxVolume = Librespot.config.maxVolume ? Librespot.config.maxVolume : 100
        } catch (e) { }
        try {
          this.Player.deviceName = Librespot.config.deviceName ? Librespot.config.deviceName : "MagicMirror"
        } catch (e) { }
      }
      else if (Raspotify) {
        try {
          this.Player.minVolume = Raspotify.config.minVolume ? Raspotify.config.minVolume : 30
        } catch (e) { }
        try {
          this.Player.maxVolume = Raspotify.config.maxVolume ? Raspotify.config.maxVolume : 100
        } catch (e) { }
        try {
          this.Player.deviceName = Raspotify.config.deviceName ? Raspotify.config.deviceName : "MagicMirror"
        } catch (e) { }
      }
    }

    this.spotify= {
      connected: false,
      player: false,
      currentVolume: 0,
      targetVolume: this.Player.maxVolume,
      repeat: null,
      shuffle: null
    }
    this.assistantSpeak= false
    var callbacks = {
      "spotifyStatus": (status) => {
        if (status) {
          /** Spotify active **/
          this.spotify.connected = true
          this.sendNotification("EXT_SPOTIFY-CONNECTED")
        } else {
          /** Spotify inactive **/
          this.sendNotification("EXT_SPOTIFY-DISCONNECTED")
          this.spotify.connected = false
          logSpotify("spotifyStatus: PLAYER Disconnected")
          this.sendNotification("EXT_SPOTIFY-PLAYER_DISCONNECTED")
          this.spotify.player = false
        }
      }
    }
    this.configHelper = {
      visual: this.Visual,
      player: this.Player
    }
    logSpotify("configHelper:" , this.configHelper)
    this.configHelper.visual.deviceDisplay = this.translate("SpotifyListenText")
    this.Spotify = new Spotify(this.configHelper.visual, callbacks, this.config.debug)

  },

  getScripts: function() {
    return [
      "/modules/EXT-Spotify/components/spotifyClass.js",
      "https://code.iconify.design/1/1.0.6/iconify.min.js"
    ]
  },

  getStyles: function () {
    return [
      "EXT-Spotify.css",
      "https://cdn.materialdesignicons.com/5.2.45/css/materialdesignicons.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
    ]
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json"
    }
  },

  getDom: function() {
    /** Create Spotify **/
    if (!this.configHelper.visual.useBottomBar) {
      return this.Spotify.prepareMini()
    } else {
      var dom = document.createElement("div")
      dom.style.display = 'none'
      return dom
    }
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.configHelper)
        if (this.configHelper.visual.useBottomBar) this.Spotify.prepare()
        break
      case "GAv4_READY":
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
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
      case "EXT_SPOTIFY-VOLUME_MIN":
        if (!this.spotify.player) return
        if (this.spotify.currentVolume <= this.configHelper.player.minVolume) return
        this.spotify.targetVolume = this.spotify.currentVolume
        this.sendSocketNotification("SPOTIFY_VOLUME", this.configHelper.player.minVolume)
        break
      case "EXT_SPOTIFY-VOLUME_MAX":
        if (!this.spotify.player) return
        if (this.spotify.targetVolume <= this.configHelper.player.minVolume) return
        this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume)
        break
      case "EXT_SPOTIFY-VOLUME_SET":
        if (!this.spotify.player || !payload) return
        if (isNaN(payload)) {
          this.sendNotification("EXT_ALERT", {
            type: "error",
            message: "Volume MUST be a number ! [0-100]",
            icon: "modules/EXT-Spotify/components/Spotify-Logo.png"
          })
          console.error("[SPOTIFY] Volume Must be a number ! [0-100]")
          return
        }
        if (payload > 100) payload = 100
        if (payload < 0) payload = 0
        logSpotify("Volume SET: " + payload)
        this.spotify.targetVolume = payload
        if (!this.assistantSpeak) this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume)
        break
      case "EXT_SPOTIFY-PLAY":
        this.SpotifyCommand("PLAY", payload)
        break
      case "EXT_SPOTIFY-PAUSE":
        this.SpotifyCommand("PAUSE")
        break
      case "EXT_STOP":
        if (!this.spotify.connected) return // don't force to stop if no device play...
        if (this.spotify.player) this.sendSocketNotification("SPOTIFY_STOP")
        break
      case "EXT_SPOTIFY-STOP":
        this.SpotifyCommand("STOP")
        break
      case "EXT_SPOTIFY-NEXT":
        this.SpotifyCommand("NEXT")
        break
      case "EXT_SPOTIFY-PREVIOUS":
        this.SpotifyCommand("PREVIOUS")
        break
      case "EXT_SPOTIFY-SHUFFLE":
        this.SpotifyCommand("SHUFFLE")
        break
      case "EXT_SPOTIFY-REPEAT":
        this.SpotifyCommand("REPEAT")
        break
      case "EXT_SPOTIFY-TRANSFER":
        this.SpotifyCommand("TRANSFER", payload)
        break
      case "EXT_SPOTIFY-SEARCH":
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

          if (payload.device.name == this.configHelper.player.deviceName) {
            this.spotify.currentVolume = payload.device.volume_percent
            if (!this.spotify.player) {
              this.spotify.player = true
              logSpotify("SPOTIFY_PLAY: PLAYER Connected")
              this.sendNotification("EXT_SPOTIFY-PLAYER_CONNECTED")
            }
          }
          else {
            if (this.spotify.player) {
              this.spotify.player = false
              logSpotify("SPOTIFY_PLAY: PLAYER Disconnected")
              this.sendNotification("EXT_SPOTIFY-PLAYER_DISCONNECTED")
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
      case "INFORMATION":
        this.sendNotification("EXT_ALERT", {
          type: "information",
          message: this.translate(payload.message, {VALUES: payload.values}),
          icon: "modules/EXT-Spotify/components/Spotify-Logo.png"
        })
        break
      case "WARNING":
        this.sendNotification("EXT_ALERT", {
          type: "warning",
          message: this.translate(payload.message, {VALUES: payload.values}),
          icon: "modules/EXT-Spotify/components/Spotify-Logo.png"
        })
        break
      case "PLAYER_RECONNECT":
        this.sendNotification("EXT_PLAYER-SPOTIFY_RECONNECT")
        break
    }
  },

  resume: function() {
    if (this.spotify.connected && this.configHelper.visual.useBottomBar) {
      this.showSpotify()
      logSpotify("Spotify is resumed.")
    }
  },

  suspend: function() {
    if (this.spotify.connected && this.configHelper.visual.useBottomBar) {
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
        this.sendSocketNotification("SPOTIFY_PLAY", payload)
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
        this.notificationReceived("EXT_SPOTIFY-VOLUME_SET", payload)
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
