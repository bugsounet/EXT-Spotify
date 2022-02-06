#!/bin/bash
# +---------------------+
# | Raspotify installer |
# | @bugsounet          |
# +---------------------+

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

# Go back to module root
# cd ..

# module name
Installer_info "Welcome to Raspotify for EXT-Spotify!"
echo

Installer_info "Installing Raspotify..."
Installer_warning "Open the fridge and take a beer..."
Installer_warning "And keep cool..."
Install_error=0

curl -sL https://dtcooper.github.io/raspotify/install.sh | sh || Install_error=1

if  [ "$Install_error" == 1 ]; then
  echo
  Installer_error "Error detected !"
  exit 255
fi

echo
Installer_info "Raspotify Configuration..."
sudo node RaspotifyConfig || Install_error=1

if  [ "$Install_error" == 1 ]; then
  echo
  Installer_error "Error detected !"
  exit 255
else
  echo
  Installer_exit "Raspotify for EXT-Spotify is now installed !"
fi
