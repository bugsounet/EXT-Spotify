/* CanvasLyrics class rev: 220918 */

class CanvasLyrics {
  constructor (config, callbacks, player) {
    this.vertical = false
    this.config = config
    this.init = callbacks.init
    this.searchCL = callbacks.searchCL
    this.closeDisplay = callbacks.closeDisplay
    this.askDevices = callbacks.askDevices
    this.alert = callbacks.alert
    this.command = callbacks.command
    this.currentPlayback = null
    this.ads = false
    this.lyrics = []
    this.devicesPanel = null
    this.player = player
    this.paths = {
      spotify: "M8 171c0 92 76 168 168 168s168-76 168-168S268 4 176 4 8 79 8 171zm230 78c-39-24-89-30-147-17-14 2-16-18-4-20 64-15 118-8 162 19 11 7 0 24-11 18zm17-45c-45-28-114-36-167-20-17 5-23-21-7-25 61-18 136-9 188 23 14 9 0 31-14 22zM80 133c-17 6-28-23-9-30 59-18 159-15 221 22 17 9 1 37-17 27-54-32-144-35-195-19zm379 91c-17 0-33-6-47-20-1 0-1 1-1 1l-16 19c-1 1-1 2 0 3 18 16 40 24 64 24 34 0 55-19 55-47 0-24-15-37-50-46-29-7-34-12-34-22s10-16 23-16 25 5 39 15c0 0 1 1 2 1s1-1 1-1l14-20c1-1 1-1 0-2-16-13-35-20-56-20-31 0-53 19-53 46 0 29 20 38 52 46 28 6 32 12 32 22 0 11-10 17-25 17zm95-77v-13c0-1-1-2-2-2h-26c-1 0-2 1-2 2v147c0 1 1 2 2 2h26c1 0 2-1 2-2v-46c10 11 21 16 36 16 27 0 54-21 54-61s-27-60-54-60c-15 0-26 5-36 17zm30 78c-18 0-31-15-31-35s13-34 31-34 30 14 30 34-12 35-30 35zm68-34c0 34 27 60 62 60s62-27 62-61-26-60-61-60-63 27-63 61zm30-1c0-20 13-34 32-34s33 15 33 35-13 34-32 34-33-15-33-35zm140-58v-29c0-1 0-2-1-2h-26c-1 0-2 1-2 2v29h-13c-1 0-2 1-2 2v22c0 1 1 2 2 2h13v58c0 23 11 35 34 35 9 0 18-2 25-6 1 0 1-1 1-2v-21c0-1 0-2-1-2h-2c-5 3-11 4-16 4-8 0-12-4-12-12v-54h30c1 0 2-1 2-2v-22c0-1-1-2-2-2h-30zm129-3c0-11 4-15 13-15 5 0 10 0 15 2h1s1-1 1-2V93c0-1 0-2-1-2-5-2-12-3-22-3-24 0-36 14-36 39v5h-13c-1 0-2 1-2 2v22c0 1 1 2 2 2h13v89c0 1 1 2 2 2h26c1 0 1-1 1-2v-89h25l37 89c-4 9-8 11-14 11-5 0-10-1-15-4h-1l-1 1-9 19c0 1 0 3 1 3 9 5 17 7 27 7 19 0 30-9 39-33l45-116v-2c0-1-1-1-2-1h-27c-1 0-1 1-1 2l-28 78-30-78c0-1-1-2-2-2h-44v-3zm-83 3c-1 0-2 1-2 2v113c0 1 1 2 2 2h26c1 0 1-1 1-2V134c0-1 0-2-1-2h-26zm-6-33c0 10 9 19 19 19s18-9 18-19-8-18-18-18-19 8-19 18zm245 69c10 0 19-8 19-18s-9-18-19-18-18 8-18 18 8 18 18 18zm0-34c9 0 17 7 17 16s-8 16-17 16-16-7-16-16 7-16 16-16zm4 18c3-1 5-3 5-6 0-4-4-6-8-6h-8v19h4v-6h4l4 6h5zm-3-9c2 0 4 1 4 3s-2 3-4 3h-4v-6h4z",
      shuffle: "M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z",
      shuffle2: "M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z",
      previous: "M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-.7.7H1.7a.7.7 0 01-.7-.7V1.7a.7.7 0 01.7-.7h1.6z",
      pause: "M2.7 1a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7H2.7zm8 0a.7.7 0 00-.7.7v12.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-2.6z",
      play: "M3 1.713a.7.7 0 011.05-.607l10.89 6.288a.7.7 0 010 1.212L4.05 14.894A.7.7 0 013 14.288V1.713z",
      next: "M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.107A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-1.6z",
      repeat: "M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z",
      repeatOne: "M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25z",
      repeatOne2: "M9.12 8V1H7.787c-.128.72-.76 1.293-1.787 1.313V3.36h1.57V8h1.55z",
      volumeOff: "M13.86 5.47a.75.75 0 00-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 008.8 6.53L10.269 8l-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L12.39 8l1.47-1.47a.75.75 0 000-1.06z",
      volumeOff2: "M10.116 1.5A.75.75 0 008.991.85l-6.925 4a3.642 3.642 0 00-1.33 4.967 3.639 3.639 0 001.33 1.332l6.925 4a.75.75 0 001.125-.649v-1.906a4.73 4.73 0 01-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 01-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z",
      volumeLow: "M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z",
      volumeMedium: "M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 000-8.474v1.65a2.999 2.999 0 010 5.175v1.649z",
      volumeHigh: "M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z",
      volumeHigh2: "M11.5 13.614a5.752 5.752 0 000-11.228v1.55a4.252 4.252 0 010 8.127v1.55z",
      speaker: "M8 6.438c.552 0 1-.434 1-.969 0-.535-.448-.969-1-.969s-1 .434-1 .969c0 .535.448.969 1 .969zm0 6.312a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z",
      speaker2: "M2.002 2.75c0-.966.784-1.75 1.75-1.75h8.5c.966 0 1.75.784 1.75 1.75v11.5a1.75 1.75 0 01-1.75 1.75h-8.5a1.75 1.75 0 01-1.75-1.75V2.75zm1.75-.25a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25h-8.5z"
    }
    console.log("[SPOTIFY][CanvasLyrics] Class Loaded")
  }

  /** Create a default display **/
  prepare() {
    let w = window.screen.width
    let h = window.screen.height
    // console.log(w,h)
    // horitonzal: 1920 1080
    // vertical: 1080 1920
    if (h>w) this.vertical = true
    var spotifyCL = document.createElement("div")
    spotifyCL.id = "EXT_SPOTIFYCL"
    spotifyCL.style.display= "none"

    const CLBackground = document.createElement("div")
    CLBackground.id = "EXT_SPOTIFYCL_BACKGROUND"
    spotifyCL.appendChild(CLBackground)

    if (this.vertical) {
      CLBackground.classList.add("hidden")
      const canvas = document.createElement("video")
      canvas.id = "EXT_SPOTIFYCL_CANVAS"
      canvas.classList.add("vertical")
      canvas.muted = true
      canvas.autoplay = true
      canvas.loop = true
      spotifyCL.appendChild(canvas)
    }

    const content = document.createElement("div")
    content.id = "EXT_SPOTIFYCL_CONTENT"
      const display = document.createElement("div")
      display.id = "EXT_SPOTIFYCL_DISPLAY"
      if (this.vertical) display.classList.add("vertical")
      content.appendChild(display)
        const playing = document.createElement("div")
        playing.id = "EXT_SPOTIFYCL_PLAYING"
        if (this.vertical) playing.classList.add("vertical")
        display.appendChild(playing)
          const logo = document.createElement("div")
          logo.id = "EXT_SPOTIFYCL_LOGO"
          logo.addEventListener('click', () => {
            if (this.player.deviceName != this.currentPlayback.device.name) {
              this.closeDisplay()
            }
          })
          playing.appendChild(logo)
          const cover = document.createElement("img")
          cover.id = "EXT_SPOTIFYCL_COVER"
          playing.appendChild(cover)
          const title = document.createElement("div")
          title.id = "EXT_SPOTIFYCL_TITLE"
          playing.appendChild(title)
          const artist = document.createElement("div")
          artist.id = "EXT_SPOTIFYCL_ARTIST"
          playing.appendChild(artist)
        const lyrics = document.createElement("div")
        lyrics.id = "EXT_SPOTIFYCL_LYRICS"
        if (this.vertical) lyrics.classList.add("vertical")
        display.appendChild(lyrics)
        if (!this.vertical) {
          const video = document.createElement("div")
          video.id = "EXT_SPOTIFYCL_VIDEO"
          display.appendChild(video)
            const canvas = document.createElement("video")
            canvas.id = "EXT_SPOTIFYCL_CANVAS"
            canvas.muted = true
            canvas.autoplay = true
            canvas.loop = true
            video.appendChild(canvas)
        }
      const CLControlBox = document.createElement("div")
      CLControlBox.id = "EXT_SPOTIFYCL_CONTROLBOX"
        const progress = document.createElement("div")
        progress.id = "EXT_SPOTIFYCL_PROGRESS"
          const bar = document.createElement("progress")
          bar.id = "EXT_SPOTIFYCL_PROGRESS_BAR"
          bar.value = 0
          bar.max = 100
          bar.addEventListener('click', e => {
            var x = e.offsetX
            var clickedValue = x * 100 / (e.target.offsetWidth)
            this.calculateSeekPosition(clickedValue.toFixed(0))
          })
          progress.appendChild(bar)
          const time = document.createElement("div")
          time.id = "EXT_SPOTIFYCL_TIME"
          progress.appendChild(time)
            const timeCurrent = document.createElement("div")
            timeCurrent.id = "EXT_SPOTIFYCL_TIMECURRENT"
            timeCurrent.textContent = "--:--"
            time.appendChild(timeCurrent)
            const timeEnd = document.createElement("div")
            timeEnd.id = "EXT_SPOTIFYCL_TIMEEND"
            timeEnd.textContent = "--:--"
            time.appendChild(timeEnd)
        CLControlBox.appendChild(progress)
        const controlDivs = document.createElement("div")
        controlDivs.id= "EXT_SPOTIFYCL_CTRLS"
          const control1 = document.createElement("div")
          control1.id= "EXT_SPOTIFYCL_CTRL1"
            const speakerControl= document.createElement("div")
            speakerControl.id= "EXT_SPOTIFYCL_SPEAKER"
            control1.appendChild(speakerControl)
              const speakerIcon= document.createElement("div")
              speakerIcon.id= "EXT_SPOTIFYCL_SPEAKERICON"
              speakerIcon.addEventListener('click', () => {
                this.askDevices()
              })
              speakerControl.appendChild(speakerIcon)
              const speakerName= document.createElement("div")
              speakerName.id= "EXT_SPOTIFYCL_SPEAKERNAME"
              speakerName.textContent= "@bugsounet Coding"
              speakerControl.appendChild(speakerName)
          controlDivs.appendChild(control1)
          const control2 = document.createElement("div")
          control2.id= "EXT_SPOTIFYCL_CTRL2"
            const controlShuffle = document.createElement("div")
            controlShuffle.id= "EXT_SPOTIFYCL_SHUFFLE"
            controlShuffle.addEventListener('click', () => {
              this.command("SHUFFLE")
            })
            control2.appendChild(controlShuffle)
            const controlPrevious = document.createElement("div")
            controlPrevious.id= "EXT_SPOTIFYCL_PREVIOUS"
            controlPrevious.addEventListener('click', () => {
              this.command("PREVIOUS")
            })
            control2.appendChild(controlPrevious)
            const controlPlay = document.createElement("div")
            controlPlay.id= "EXT_SPOTIFYCL_PLAY"
            controlPlay.addEventListener('click', () => {
              if (this.currentPlayback && this.currentPlayback.is_playing) this.command("PAUSE")
              else this.command("PLAY")
            })
            control2.appendChild(controlPlay)
            const controlNext = document.createElement("div")
            controlNext.id= "EXT_SPOTIFYCL_NEXT"
            controlNext.addEventListener('click', () => {
              this.command("NEXT")
            })
            control2.appendChild(controlNext)
            const controlRepeat = document.createElement("div")
            controlRepeat.id= "EXT_SPOTIFYCL_REPEAT"
            controlRepeat.addEventListener('click', () => {
              this.command("REPEAT")
            })
            control2.appendChild(controlRepeat)
          controlDivs.appendChild(control2)
          const control3 = document.createElement("div")
          control3.id= "EXT_SPOTIFYCL_CTRL3"
            const volumeControl= document.createElement("div")
            volumeControl.id= "EXT_SPOTIFYCL_VOLUME"
              const volumeIcon = document.createElement("div")
              volumeIcon.id= "EXT_SPOTIFYCL_VOLUMEICON"
              volumeControl.appendChild(volumeIcon)
              const volumeValue = document.createElement("progress")
              volumeValue.id= "EXT_SPOTIFYCL_VOLUMEVALUE"
              if (this.vertical) volumeValue.classList.add("vertical")
              volumeValue.value = 0
              volumeValue.max = 100
              volumeValue.addEventListener('click', e => {
                var x = e.offsetX
                var clickedValue = x * 100 / (e.target.offsetWidth)
                this.command("VOLUME", clickedValue.toFixed(0))
              })
              volumeControl.appendChild(volumeValue)
            control3.appendChild(volumeControl)
          controlDivs.appendChild(control3)
        CLControlBox.appendChild(controlDivs)
      content.appendChild(CLControlBox)
    spotifyCL.appendChild(content)

    document.body.appendChild(spotifyCL)

    /** Draw SVG icon **/
    var drawSpotify = SVG().addTo('#EXT_SPOTIFYCL_LOGO').viewbox(0,0,1134,340).fill('#1db954').move(0, 10)
    drawSpotify = drawSpotify.path(this.paths.spotify)

    var drawShuffle = SVG().addTo('#EXT_SPOTIFYCL_SHUFFLE').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('shuffleCL')
    var drawShufflePath = drawShuffle.path(this.paths.shuffle)
    drawShufflePath= drawShuffle.path(this.paths.shuffle2)

    var drawPrevious = SVG().addTo('#EXT_SPOTIFYCL_PREVIOUS').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10)
    drawPrevious = drawPrevious.path(this.paths.previous)

    var drawPlay = SVG().addTo('#EXT_SPOTIFYCL_PLAY').size("32px", "32px").viewbox(0,0,16,16).fill('black').move(0, 10).addClass('playCL')
    drawPlay = drawPlay.path(this.paths.play)

    var drawNext = SVG().addTo('#EXT_SPOTIFYCL_NEXT').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10)
    drawNext = drawNext.path(this.paths.next)

    var drawRepeat = SVG().addTo('#EXT_SPOTIFYCL_REPEAT').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('repeatCL')
    drawRepeat = drawRepeat.path(this.paths.repeat)

    var drawVolume = SVG().addTo('#EXT_SPOTIFYCL_VOLUMEICON').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('volumeCL')
    var drawVolumePath = drawVolume.path(this.paths.volumeHigh)
    drawVolumePath = drawVolume.path(this.paths.volumeHigh2)

    var speaker = SVG().addTo('#EXT_SPOTIFYCL_SPEAKERICON').size("32px", "32px").viewbox(0,0,16,16).fill('#1db954').move(0, 10)
    var speakerPath = speaker.path(this.paths.speaker)
    speakerPath = speaker.path(this.paths.speaker2)

    const buttonSpeaker = document.querySelector("#EXT_SPOTIFYCL_SPEAKERICON")
    this.devicesPanel = new JSPanel(buttonSpeaker, {
      bottom: 40,
      right: 0,
      left: 0,
      items: [
        {
          id: "0",
          title: "Select a device:"
        },
        {
          id: "1",
          separator: true
        },
        {
          id: "2",
          title: "No devices"
        }
      ]
    })

    this.init()
  }

  updateDevicesList(devices) {
    const buttonSpeaker = document.querySelector("#EXT_SPOTIFYCL_SPEAKERICON")
    let createList = [
      {
        id: "0",
        title: "Select a device:"
      },
      {
        id: "1",
        separator: true
      },
      {
        id: "2",
        title: "No device"
      },
    ]

    let item = {}
    this.devicesPanel.removeItems(this.devicesPanel.getAllIDS())
    createList.forEach((item,id) => {
      if (id == "2") {
        if (!devices.length) this.devicesPanel.addItem(item)
      } else {
        this.devicesPanel.addItem(item)
      }
    })
    devices.forEach((device,id) => {
      item = {
        id: id+2,
        title: device.name,
        fontawesome_icon: this.getFAIcon(device.type),
        onclick: () => this.command("TRANSFERID", device.id)
      }
      if (!device.is_active) this.devicesPanel.addItem(item)
    })
  }

  async updateCurrentSpotify(current) {
    if (!current) return
    if (!this.currentPlayback) {
      this.updateBackground(current.item)
      this.updateSongInfo(current.item)
      this.updatePlaying(current.is_playing)
      if (current.device) {
        this.updateVolume(current.device.volume_percent)
        this.updateDeviceName(current.device.name)
      }
      this.updateShuffle(current.shuffle_state)
      this.updateRepeat(current.repeat_state)
      if (current.is_playing && current.item) this.updateProgress(current.progress_ms, current.item.duration_ms)
      this.searchCL(current.item)
    } else {
      /** for Ads **/
      if (current.currently_playing_type == "ad") {
        this.ads = true
        current.is_playing = false
      }
      if (this.currentPlayback.is_playing !== current.is_playing) {
        this.updatePlaying(current.is_playing)
      }
      if (current.currently_playing_type == "ad") {
        this.currentPlayback.is_playing = false
        return
      }
      if (this.ads) {
        this.currentPlayback = null
        this.ads = false
        return
      }
      /** prevent all error **/
      if (!current.item || !current.device || !current.progress_ms || !current.item.duration_ms) return this.currentPlayback = null
      if (!this.currentPlayback.item) return this.currentPlayback = current

      /** All is good so ... live update **/
      if (this.currentPlayback.item.id !== current.item.id) {
        this.searchCL(current.item)
        this.updateBackground(current.item)
        this.updateSongInfo(current.item)
      }

      if (this.currentPlayback.device.name !== current.device.name) {
        this.updateDeviceName(current.device.name)
      }
      if (this.currentPlayback.device.volume_percent !== current.device.volume_percent) {
        this.updateVolume(current.device.volume_percent)
      }
      if (this.currentPlayback.shuffle_state !== current.shuffle_state) {
        this.updateShuffle(current.shuffle_state)
      }
      if (this.currentPlayback.repeat_state !== current.repeat_state) {
        this.updateRepeat(current.repeat_state)
      }
      if (this.currentPlayback.progress_ms !== current.progress_ms) {
        this.updateProgress(current.progress_ms, current.item.duration_ms)
        await this.displayActiveLyrics(current.progress_ms)
      }
    }
    this.currentPlayback = current
  }

  updateBackground(playbackItem) {
    if (!playbackItem) return
    var img_url
    if (playbackItem.album) img_url = playbackItem.album.images[0].url
    else img_url = playbackItem.images[0].url
    const back = document.getElementById("EXT_SPOTIFYCL_BACKGROUND")
    if (img_url !== back.src) back.style.backgroundImage = `url(${img_url})`
  }

  displayCanvas(result) {
    const canvas = document.getElementById("EXT_SPOTIFYCL_CANVAS")
    const back = document.getElementById("EXT_SPOTIFYCL_BACKGROUND")
    if (this.config.noCanvas) {
      if (this.vertical) {
        canvas.classList.add("hidden")
        back.classList.remove("hidden")
      }
      return
    }
    if (!result.success || (result.canvas.url.endsWith("jpg"))) {
      canvas.classList.add("hidden")
      canvas.removeAttribute('src')
      canvas.load()
      if (this.vertical) back.classList.remove("hidden")
    } else {
      if (this.vertical) back.classList.add("hidden")
      canvas.src= result.canvas.url
      canvas.play()
      canvas.classList.remove("hidden")
    }
  }

  updateProgress(progressMS, durationMS) {
    const bar = document.getElementById("EXT_SPOTIFYCL_PROGRESS_BAR")
    bar.value = progressMS

    if (bar.max != durationMS) bar.max = durationMS

    const current = document.getElementById("EXT_SPOTIFYCL_TIMECURRENT")
    current.innerText = this.msToTime(progressMS)
    const end = document.getElementById("EXT_SPOTIFYCL_TIMEEND")
    end.innerText = this.msToTime(durationMS)
  }

  updateSongInfo(playbackItem) {
    if (!playbackItem) return

    const cover_img = document.getElementById("EXT_SPOTIFYCL_COVER")

    var img_url

    if (playbackItem.album) img_url = playbackItem.album.images[1].url
    else img_url = playbackItem.images[1].url
    if (img_url !== cover_img.src) cover_img.src = img_url

    const title = document.getElementById("EXT_SPOTIFYCL_TITLE")
    title.textContent = playbackItem.name

    const artist = document.getElementById("EXT_SPOTIFYCL_ARTIST")
    const artists = playbackItem.artists
    let artistName = ""
    if (playbackItem.album){
      for (let x = 0; x < artists.length; x++) {
        if (!artistName) {
          artistName = artists[x].name
        } else {
          artistName += ", " + artists[x].name
        }
      }
    } else{
      artistName = playbackItem.show.publisher
    }
    artist.textContent = artistName
  }

  updateVolume(volume) {
    const volumeValue = document.getElementById("EXT_SPOTIFYCL_VOLUMEVALUE")
    volumeValue.value = volume
    var volumeSVG = SVG.find('.volumeCL')
    volumeSVG.remove()
    if (volume == 0) {
      var drawVolume = SVG().addTo('#EXT_SPOTIFYCL_VOLUMEICON').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('volumeCL')
      var drawVolumePath = drawVolume.path(this.paths.volumeOff)
      drawVolumePath = drawVolume.path(this.paths.volumeOff2)
    } else if (volume > 0 && volume < 33) {
      var drawVolume = SVG().addTo('#EXT_SPOTIFYCL_VOLUMEICON').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('volumeCL')
      drawVolume = drawVolume.path(this.paths.volumeLow)
    } else if (volume >= 33 && volume < 66) {
      var drawVolume = SVG().addTo('#EXT_SPOTIFYCL_VOLUMEICON').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('volumeCL')
      drawVolume = drawVolume.path(this.paths.volumeMedium)
    } else if (volume >= 66) {
      var drawVolume = SVG().addTo('#EXT_SPOTIFYCL_VOLUMEICON').size("32px", "32px").viewbox(0,0,16,16).fill('white').move(0, 10).addClass('volumeCL')
      var drawVolumePath = drawVolume.path(this.paths.volumeHigh)
      drawVolumePath = drawVolume.path(this.paths.volumeHigh2)
    }
  }

  updateDeviceName(name) {
    const speakerName = document.getElementById("EXT_SPOTIFYCL_SPEAKERNAME")
    speakerName.textContent= name
  }

  updateShuffle(shuffle) {
    var shuffleSVG = SVG.find('.shuffleCL')
    if (shuffle) shuffleSVG.fill('#1db954')
    else shuffleSVG.fill('white')
  }

  updateRepeat(repeat) {
    var repeatSVG = SVG.find('.repeatCL')
    repeatSVG.remove()
    if (repeat == "off" || repeat == "context") {
      var drawRepeat = SVG().addTo('#EXT_SPOTIFYCL_REPEAT').size("32px", "32px").viewbox(0,0,16,16).move(0, 10).addClass('repeatCL')
      drawRepeat = drawRepeat.path(this.paths.repeat)
      if (repeat == "off") drawRepeat.fill('white')
      if (repeat == "context" ) drawRepeat.fill('#1db954')
    } else {
      var drawRepeat = SVG().addTo('#EXT_SPOTIFYCL_REPEAT').size("32px", "32px").viewbox(0,0,16,16).fill('#1db954').move(0, 10).addClass('repeatCL')
      var drawrepeatOnePath = drawRepeat.path(this.paths.repeatOne)
      drawrepeatOnePath = drawRepeat.path(this.paths.repeatOne2)
    }
  }

  updatePlaying(playing) {
    const s = document.getElementById("EXT_SPOTIFYCL")
    const video = document.getElementById("EXT_SPOTIFYCL_CANVAS")
    var playSVG = SVG.find('.playCL')
    playSVG.remove()
    if (playing) {
      s.classList.remove("pausing")
      if (!this.config.noCanvas) video.play()
      var drawPlay = SVG().addTo('#EXT_SPOTIFYCL_PLAY').size("32px", "32px").viewbox(0,0,16,16).fill('black').move(0, 10).addClass('playCL')
      drawPlay = drawPlay.path(this.paths.pause)
    } else {
      s.classList.add("pausing")
      if (!this.config.noCanvas) video.pause()
      var drawPlay = SVG().addTo('#EXT_SPOTIFYCL_PLAY').size("32px", "32px").viewbox(0,0,16,16).fill('black').move(0, 10).addClass('playCL')
      drawPlay = drawPlay.path(this.paths.play)
    }
  }

  async loadLyrics(result) {
    this.lyrics = []
    this.lyrics = await this.decodeLyrics(result)
    this.displayLyrics()
  }

  decodeLyrics(result) {
    return new Promise((resolve) => {
      let lyrics = []
      let error = 0
      if (result.success) {
        result.lyrics.lines.forEach(lyric => {
          let line = {
            time: lyric.time,
            words: lyric.words[0].string
          }
          if (!lyric.time) error++
          lyrics.push(line)
        })
        let lastLines = {
          time: 43200000,
          words: "‎ "
        }
        lyrics.push(lastLines)
        lastLines = {
          time: 43200001,
          words: "~~ Provided by " + result.lyrics.provider + " ~~"
        }
        lyrics.push(lastLines)
        console.log("[SPOTIFY][Lyrics] Lyrics Loaded")
      }
      if (error) {
        this.alert({
          message: "Lyrics are not sync with this title",
          type: "warning"
        })
        console.log("[SPOTIFY][Lyrics] Lyrics not sync with title")
      }
      resolve(lyrics)
    })
  }

  displayLyrics() {
    console.log("[SPOTIFY][Lyrics] Display Lyrics")
    var lyricBox = document.getElementById("EXT_SPOTIFYCL_LYRICS")
    lyricBox.innerHTML= ""
    this.lyrics.forEach(line => {
      var lyricLine = document.createElement("div")
      lyricLine.id = "EXT_SPOTIFYCL_LINE"
      lyricLine.classList.add(line.time)
      lyricLine.textContent = line.words
      lyricBox.appendChild(lyricLine)
    })
  }

  displayActiveLyrics(time) {
    return new Promise((resolve) => {
      time = time +500 // pre-display
      this.lyrics.forEach((line, nb) => {
        var focus = document.getElementsByClassName(line.time)[0]

        if (line.time < time) {
          // hide all lyric < current time
          focus.classList.add("hidden")
          focus.classList.remove("active")
        } else {
          // show others lyric
          focus.classList.remove("hidden")
          focus.classList.remove("active")
        }

        // end of lyrics
        if (!this.lyrics[nb+1]) return

        if (time >= line.time && time <= this.lyrics[nb+1].time) {
          // focus in active lyric
          focus.classList.remove("hidden")
          focus.classList.add("active")

          // don't hide last 10 lyrics lines
          for (let x = 1; x <11; x++) {
            if (this.lyrics[nb-x]) {
              var oldFocus = document.getElementsByClassName(this.lyrics[nb-x].time)[0]
              oldFocus.classList.remove("hidden")
              oldFocus.classList.remove("active")
            }
          }
        }
      })
      resolve()
    })
  }

  calculateSeekPosition(percent) {
    if (this.currentPlayback.item && this.currentPlayback.item.duration_ms) {
      let seek = ((percent * this.currentPlayback.item.duration_ms) / 100).toFixed(0)
      this.command("SEEK", seek)
    }
  }

  /** Tools **/
  msToTime(duration) {
    let ret = ""
    let seconds = parseInt((duration / 1000) % 60)
      , minutes = parseInt((duration / (1000 * 60)) % 60)
      , hours = parseInt((duration / (1000 * 60 * 60)) % 24)
    if (hours > 0) {
      hours = (hours < 10) ? "0" + hours : hours
      ret = ret + hours + ":"
    }
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds
    return ret + minutes + ":" + seconds
  }

  getFAIcon(iconType) {
    switch (iconType) {
      // Device Icons
      case 'Tablet':
        return 'fas fa-tablet fa-sm'
      case 'GameConsole':
        return 'fas fa-gamepad fa-sm'
      case 'AVR':
      case 'STB':
        return 'mdi mdi-audio-video'
      case 'AudioDongle':
      case 'CastVideo':
        return 'mdi mdi-cast-connected'
      case 'CastAudio':
      case 'Speaker':
        return 'mdi mdi-cast-audio'
      case 'Automobile':
        return 'fas fa-car fa-sm'
      case 'Smartphone':
        return 'fas fa-mobile fa-sm'
      case 'TV':
        return 'fas fa-tv fa-sm'
      case 'Unknown':
      case 'Computer':
        return 'fa fa-desktop fa-sm'
      default:
        return 'fa fa-headphones fa-sm'
    }
  }
}
