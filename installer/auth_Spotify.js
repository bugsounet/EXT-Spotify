/** Spotify setup **/
/** @bugsounet **/

const fs = require("fs")
const path = require("path")
const Spotify = require("../components/spotifyLib.js")

let file = path.resolve(__dirname, "../../../config/config.js")
let found = false
let config = {}

if (fs.existsSync(file)) {
  var MMConfig = require(file)
  var MMModules = MMConfig.modules
}
else return console.log("config.js not found !?")

for (let [nb, module] of Object.entries(MMModules)) {
  if (module.module == "EXT-Spotify") {
    found = true
    if (!module.config) return console.log("Please configure this module in config.js file before!")
    if (!module.config.CLIENT_SECRET) return console.log("CLIENT_SECRET is not defined in spotify module config !")
    if (!module.config.CLIENT_ID) return console.log("CLIENT_ID is not defined in spotify module config !")
    /** All is Good ! **/
    config.TOKEN = "./tokenSpotify.json"
    config.CLIENT_SECRET = module.config.CLIENT_SECRET
    config.CLIENT_ID = module.config.CLIENT_ID
    config.PATH = "../"
  }
}
if (!found) return console.log("EXT-Spotify not configured in config.js")

let Auth = new Spotify(config, null, true, true)
Auth.authFlow(() => {
  console.log("[SPOTIFY_AUTH] Authorization is finished. Check ", config.TOKEN)
}, (e) => {
  console.log(e)
})
