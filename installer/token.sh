#!/bin/bash
# +---------+
# | Tokens  |
# +---------+

# get the installer directory
Installer_get_current_dir () {
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  echo "$( cd -P "$( dirname "$SOURCE" )" && pwd )"
}

Installer_dir="$(Installer_get_current_dir)"

# move to installler directory
cd "$Installer_dir"
source utils.sh
Installer_info "Welcome to Spotify Token generator!"
echo
Installer_beep=false

echo
Installer_yesno "Do you want to install/reinstall Spotify token?" && (
  rm -f ../tokenSpotify.json
  node auth_Spotify
  echo
)

echo
Installer_success "Done."
