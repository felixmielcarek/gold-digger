//#region REQUIRE
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
//#endregion

//#region CONSTANTS
const commonDir = path.join(__dirname, '../common');
const GDPlaylistName = "Gold Digger";
var accessToken;
try { accessToken = fs.readFileSync(commonDir+'/spotify_access_token', 'utf8') } 
catch (err) { console.error(err) }
//#endregion

//#region CREATES GD PLAYLIST
function getPlaylistsDictionary() {
    return new Promise((resolve, reject) => {
        function addPlaylistsToDictionary(playlistsDictionary,href=`https://api.spotify.com/v1/me/playlists?limit=10&offset=0`) {
            axios.get(
                href, { headers: { Authorization: 'Bearer ' + accessToken } }
            ).then(response => {
                response.data.items.forEach(element => playlistsDictionary[element.id] = element.name);
                console.log(response.data.items.length)
                if(response.data.next) addPlaylistsToDictionary(playlistsDictionary,response.data.next)
                else resolve(playlistsDictionary);
            }).catch(error => { console.log(error.response.status) });
        }
        addPlaylistsToDictionary({});
    });
}

function GDPlaylistExists(playlistsDictionary) {
    for (const id in playlistsDictionary)
        if (playlistsDictionary.hasOwnProperty(id) && playlistsDictionary[id] === GDPlaylistName)
            return true;
    return false;
}

async function createsGDPlaylist() {
    try {
        const playlistsDictionary = await getPlaylistsDictionary();
        if(!GDPlaylistExists(playlistsDictionary)) console.log("Playlist doesn't exists");
    } catch (error) {
        console.log('Error occurred:', error);
    }
}

//#endregion

//#region EXPORTS
module.exports = {
    createsGDPlaylist: createsGDPlaylist,

    // For tests
    GDPlaylistName: GDPlaylistName,
    GDPlaylistExists: GDPlaylistExists,
}
//#endregion
