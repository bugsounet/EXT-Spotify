/**
 ** Plugin: EXT-Spotify
 ** @bugsounet
 ** 09/2023
 ** support: https://forum.bugsounet.fr
 **/

logSpotify = (...args) => { /* do nothing */ }

Module.register("EXT-Spotify", {
  requiresVersion: "2.25.0",

  defaults: {
    debug: false,
    mini: true,
    forceSCL: false,
    noCanvas: false,
    updateInterval: 1000,
    idleInterval: 10000,
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
      PATH: "../",
      TOKEN: "tokenSpotify.json",
      CLIENT_ID: this.config.CLIENT_ID,
      CLIENT_SECRET: this.config.CLIENT_SECRET
    }
    this.SCL = false
    this.SPOTIFYCL = false
    this.ForceSCL = false
    this.SPOTIFYCL_Ready = false
    this.init = false
    this.SpotifyCurrentID = null
    /** Search player **/
    let Librespot = config.modules.find(m => m.module == "EXT-Librespot")
    if (Librespot && !Librespot.disabled) {
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
    }
    /** Search SpotifyCanvasLyrics **/
    let SpotifyCanvasLyrics = config.modules.find(m => m.module == "EXT-SpotifyCanvasLyrics")
    if (SpotifyCanvasLyrics && !SpotifyCanvasLyrics.disabled) {
      this.SCL = true
      if (this.config.forceSCL) this.ForceSCL= this.config.forceSCL
      logSpotify("EXT-SpotifyCanvasLyrics Found!")
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
          if (this.SCL) {
            this.SPOTIFYCL = false
            this.HideOrShow(false)
          }
          this.sendNotification("EXT_SPOTIFY-PLAYER_DISCONNECTED")
          this.spotify.player = false
        }
      },
      "spotifyPlaying": (play) => {
        this.sendNotification("EXT_SPOTIFY-PLAYING", play)
      },
      "spotifyForceSCL": () => {
        if (this.SCL) this.ForceSCL = true
      },
      "init": () => { this.init = true },
      "command": (command, param) => {
        switch(command) {
          case "PLAY":
            this.SpotifyCommand("PLAY")
            break
          case "PAUSE":
            this.SpotifyCommand("PAUSE")
            break
          case "NEXT":
            this.SpotifyCommand("NEXT")
            break
          case "PREVIOUS":
            this.SpotifyCommand("PREVIOUS")
            break
          case "SEEK":
            this.SpotifyCommand("SEEK", param)
            break
          case "REPEAT":
            this.SpotifyCommand("REPEAT")
            break
          case "SHUFFLE":
            this.SpotifyCommand("SHUFFLE")
            break
          case "TRANSFERID":
            this.sendSocketNotification("SPOTIFY_TRANSFER_BYID", param)
            break
          case "VOLUME":
            if (isNaN(param)) {
              this.sendNotification("EXT_ALERT", {
                type: "error",
                message: "Volume MUST be a number ! [0-100]",
                icon: "modules/EXT-Spotify/components/Spotify-Logo.png"
              })
              console.error("[SPOTIFY] Volume Must be a number ! [0-100]")
              return
            }
            if (param > 100) param = 100
            if (param < 0) param = 0
            logSpotify("Volume FORCE SET: " + param)
            this.spotify.targetVolume = param
            if (!this.assistantSpeak) this.sendSocketNotification("SPOTIFY_VOLUME", this.spotify.targetVolume)
            break
        }
      },
      "closeDisplay": () => {
        this.ForceSCL = false
        this.SPOTIFYCL = false
        this.HideOrShow(false)
      },
      "askDevices": () => {
        this.sendSocketNotification("ASK_DEVICES")
      },
      "alert": (params) => {
        this.sendNotification("EXT_ALERT", params)
      },
      "searchCL": (item) => {
        if (!item || !item.id || (this.SpotifyCurrentID == item.id)) return
        this.SpotifyCurrentID = item.id
        this.sendNotification("EXT_SCL-GET_LYRICS" , this.SpotifyCurrentID)
        if (!this.config.noCanvas) this.sendNotification("EXT_SCL-GET_CANVAS" , this.SpotifyCurrentID)
      }
    }
    this.configHelper = {
      visual: this.Visual,
      player: this.Player,
      SCL: this.SCL,
      debug: this.config.debug
    }
    this.configClass = {
      debug: this.config.debug,
      deviceDisplay: this.translate("SpotifyListenText"),
      mini: this.config.mini,
      noCanvas: this.config.noCanvas,
      hide: (...args) => this.hide(...args),
      show: (...args) => this.show(...args)
    }
    logSpotify("configHelper:" , this.configHelper)
    this.Spotify = new Spotify(this.configClass, callbacks)
    if (this.SCL) this.CanvasLyrics = new CanvasLyrics(this.configClass, callbacks, this.Player)
  },

  getScripts: function() {
    return [
      "/modules/EXT-Spotify/components/spotifyClass.js",
      "https://code.iconify.design/1/1.0.6/iconify.min.js",
      "/modules/EXT-Spotify/components/CanvasLyrics.js",
      "/modules/EXT-Spotify/components/JSPanel.js"
    ]
  },

  getStyles: function () {
    return [
      "EXT-Spotify.css",
      "https://cdn.materialdesignicons.com/5.2.45/css/materialdesignicons.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
      "https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js",
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
      ko: "translations/ko.json",
      el: "translations/el.json",
      "zh-cn": "translations/zh-cn.json",
      tr: "translations/tr.json"
    }
  },

  getDom: function() {
    /** Create Spotify **/
    return this.Spotify.prepare()
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "GA_READY":
        if (sender.name == "MMM-GoogleAssistant") {
          this.sendSocketNotification("INIT", this.configHelper)
          if (this.SCL) this.CanvasLyrics.prepare()
          this.sendNotification("EXT_HELLO", this.name)
          if (this.config.forceSCL) setTimeout( () => { this.sendNotification("EXT_SPOTIFY-SCL_FORCED", true) } ,1000)
        }
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
      case "EXT_SPOTIFY-SEEK":
        this.SpotifyCommand("SEEK", payload)
        break
      case "EXT_SPOTIFY-SCL":
        if (!this.SCL) return
        this.ForceSCL = payload
        this.sendNotification("EXT_SPOTIFY-SCL_FORCED", payload)
        if (!this.spotify.connected) return
        if (this.ForceSCL) {
          this.HideOrShow(true)
          this.SPOTIFYCL = true
        } else {
          this.SPOTIFYCL = false
          this.HideOrShow(false)
        }
        break
      case "EXT_SCL-SEND_CANVAS":
        if (sender.name != "EXT-SpotifyCanvasLyrics") return
        this.CanvasLyrics.displayCanvas(payload)
        break
      case "EXT_SCL-SEND_LYRICS":
        if (sender.name != "EXT-SpotifyCanvasLyrics") return
        this.CanvasLyrics.loadLyrics(payload)
        break
      case "EXT_SCL-READY":
        this.SPOTIFYCL_Ready = true
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      /** Spotify module **/
      case "SPOTIFY_PLAY":
        this.Spotify.updateCurrentSpotify(payload)
        if (this.SCL && this.init && this.SPOTIFYCL_Ready && (this.ForceSCL || (payload.device && payload.device.name == this.Player.deviceName))) {
          this.CanvasLyrics.updateCurrentSpotify(payload)
          this.HideOrShow(true)
          this.SPOTIFYCL = true
        } else this.Spotify.updateCurrentSpotify(payload)
        if (!this.spotify.connected) return // don't check if not connected (use spotify callback)
        if (payload && payload.device && payload.device.name) {
          this.spotify.repeat = payload.repeat_state
          this.spotify.shuffle = payload.shuffle_state
          if (payload.device.name == this.configHelper.player.deviceName) {
            this.spotify.currentVolume = payload.device.volume_percent
            if (!this.spotify.player) {
              this.spotify.player = true
              logSpotify("SPOTIFY_PLAY: PLAYER Connected")
              if (this.SCL) {
                this.HideOrShow(true)
                this.SPOTIFYCL = true
              }
              this.sendNotification("EXT_SPOTIFY-PLAYER_CONNECTED")
            }
          }
          else {
            if (this.spotify.player) {
              this.spotify.player = false
              logSpotify("SPOTIFY_PLAY: PLAYER Disconnected")
              if (this.SCL) {
                this.SPOTIFYCL = false
                this.HideOrShow(false)
              }
              this.sendNotification("EXT_SPOTIFY-PLAYER_DISCONNECTED")
            }
          }
        }
        break
      case "SPOTIFY_DEVICELIST":
        this.CanvasLyrics.updateDevicesList(payload.devices)
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

  HideOrShow: function (hide) {
    if (this.SPOTIFYCL) return
    let SpotifyWrapper = document.getElementById("EXT_SPOTIFY")
    let SpotifyCLWrapper = document.getElementById("EXT_SPOTIFYCL")
    if (hide) {
      MM.getModules().enumerate((module) => {
        module.hide(200, () => {}, {lockString: "EXT-SPOTIFY_LOCKED"})
      })
      removeAnimateCSS("EXT_SPOTIFYCL", "backOutRight")
      addAnimateCSS("EXT_SPOTIFYCL", "backInLeft",1)
      SpotifyCLWrapper.style.display= "block"
    } else {
      removeAnimateCSS("EXT_SPOTIFYCL", "backInLeft")
      addAnimateCSS("EXT_SPOTIFYCL", "backOutRight",1)
      setTimeout(() => {
        SpotifyCLWrapper.style.display= "none"
        MM.getModules().enumerate((module)=> {
          module.show(200, () => {}, {lockString: "EXT-SPOTIFY_LOCKED"})
        })
      },1000)
    }
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/
  EXT_TELBOTCommands: function(commander) {
    commander.add({
      command: "spotify",
      description: "Spotify commands",
      callback: "tbSpotify"
    })
    if (this.SCL) {
      commander.add({
        command: "lyrics",
        description: "Spotify Canvas Lyrics",
        callback: "tbSCL"
      })
    }
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

  tbSCL: function(command, handler) {
    if (handler.args) {
      var args = handler.args.toLowerCase().split(" ")
      var params = handler.args.split(" ")
      if (args[0] == "on") {
        handler.reply("TEXT", "Turn on Lyrics")
        this.notificationReceived("EXT_SPOTIFY-SCL", true)
      }
      else if (args[0] == "off") {
        handler.reply("TEXT", "Turn off Lyrics")
        this.notificationReceived("EXT_SPOTIFY-SCL", false)
      }
      else {
        handler.reply("TEXT", "I don't know... Try /lyrics",{parse_mode:'Markdown'})
      }
    } else {
      handler.reply("TEXT", 'Need Help for /lyrics commands ?\n\n\
  *on*: Turn on Canvas Lyrics mode\n\
  *off*: Turn off Canvas Lyrics mode\
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
        if (this.spotify.player) {
          this.sendSocketNotification("SPOTIFY_STOP")
        }
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
        let nextRepeatState
        if (this.spotify.repeat == "off") nextRepeatState = "context"
        if (this.spotify.repeat == "context") nextRepeatState = "track"
        if (this.spotify.repeat == "track") nextRepeatState = "off"
        this.sendSocketNotification("SPOTIFY_REPEAT", nextRepeatState)
        break
      case "TRANSFER":
        this.sendSocketNotification("SPOTIFY_TRANSFER", payload)
        break
      case "VOLUME":
        this.notificationReceived("EXT_SPOTIFY-VOLUME_SET", payload)
        break
      case "SEEK":
        this.sendSocketNotification("SPOTIFY_SEEK", payload)
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
