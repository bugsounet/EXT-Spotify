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
    visual: {
      updateInterval: 1000,
      idleInterval: 10000,
      useBottomBar: false,
      PATH: "../", // Needed Don't modify it !
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
      targetVolume: this.config.maxVolume,
      repeat: null,
      shuffle: null,
      forceVolume: false
    }
    var callbacks = {
      "spotifyStatus": (status) => { // try to use spotify callback to unlock screen ...
        if (status) {
          /** Spotify active **/
          this.spotify.connected = true
        } else {
          /** Spotify inactive **/
          this.spotify.connected = false
          this.spotify.player = false
        }
      }
    }
    this.config.visual.deviceDisplay = this.translate("SpotifyListenText")
    this.config.visual.SpotifyForGA = this.translate("SpotifyForGA")
    this.Spotify = new Spotify(this.config.visual, callbacks, this.config.debug)
    this.spotifyNewVolume = false
  },

  getScripts: function() {
    return [
      "/modules/EXT-Spotify/components/spotifyClass.js"
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
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      /** Spotify module **/
      case "SPOTIFY_PLAY":
        this.Spotify.updateCurrentSpotify(payload)
        if (!this.spotify.connected) return // don't check if not connected (use spotify callback)
        if (payload && payload.device && payload.device.name) { //prevent crash
          this.spotify.repeat = payload.repeat_state
          this.spotify.shuffle = payload.shuffle_state

          if (payload.device.name == this.config.deviceName) {
            this.spotify.currentVolume = payload.device.volume_percent
            if (!this.spotify.player) this.spotify.player = true
          }
          else {
            if (this.spotify.player) this.EXT.spotify.player = false
          }
        }
        break
      case "SPOTIFY_IDLE":
        this.Spotify.updatePlayback(false)
        this.spotify.player = false
        break
      case "DONE_SPOTIFY_VOLUME":
        if (this.spotify.forceVolume) {
          if (this.spotify.player) {
            this.spotify.targetVolume = payload
          }
        }
        break
    }
  },

  resume: function() {
    if (this.spotify.connected && this.config.visual.useBottomBar) {
      this.showSpotify()
      logEXT("Spotify is resumed.")
    }
  },

  suspend: function() {
    if (this.spotify.connected && this.config.visual.useBottomBar) {
      this.hideSpotify()
      logEXT("Spotify is suspended.")
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
  }
})
