//#region REQUIRE
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
//#endregion

//#region VARIABLES
const commonDir = path.join(__dirname, '../common');
const GDPlaylistName = "Gold Digger";
var GDPlaylistId;
var playlistsIds = {};
var albumIds = [];
var trackIds = [];

var accessToken;
try { accessToken = fs.readFileSync(commonDir + '/spotify_access_token', 'utf8') }
catch (err) { console.error(err) }
//#endregion

//#region CREATE GD PLAYLIST
async function addPlaylistsToDictionary(dictionary, href = `https://api.spotify.com/v1/me/playlists?limit=10&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } })
        response.data.items.forEach(element => dictionary[element.id] = element.name);
        if (response.data.next)
            await addPlaylistsToDictionary(dictionary, response.data.next)
    } catch (error) { console.log(error.response.status) }
}

function GDPlaylistExists(playlistsDictionary) {
    for (const id in playlistsDictionary)
        if (playlistsDictionary.hasOwnProperty(id) && playlistsDictionary[id] === GDPlaylistName) {
            GDPlaylistId = id; //will be needed later
            return true;
        }
    return false;
}

async function getUserId() {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me', { headers: { 'Authorization': 'Bearer ' + accessToken, } });
        return response.data.id;
    } catch (error) { console.log(error.response.status) }
}

async function createPlaylist() {
    const id = await getUserId();
    const options = {
        method: 'POST',
        url: `https://api.spotify.com/v1/users/${id}/playlists`,
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            'name': 'Gold Digger',
            'description': "She take my money, when I'm in need",
            'public': true,
        }),
    };
    try {
        const response = await axios(options);
        GDPlaylistId = response.data.id; //will be needed later
    } catch (error) { console.log(error.response.status) }
}

async function createsGDPlaylist() {
    var dictionary = {};
    await addPlaylistsToDictionary(dictionary);
    if (!GDPlaylistExists(dictionary)) await createPlaylist();

    //to avoid recovering a second time the playlist when getting library
    playlistsIds = Object.keys(dictionary).filter((id) => id !== GDPlaylistId);
}
//#endregion

//#region GET LIBRARY
function getPlaylists() {
    console.log(playlistsIds);
}

async function addAlbumsToList(href = `https://api.spotify.com/v1/me/albums?limit=10&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } })
        response.data.items.forEach(element => albumIds.push(element.album.id));
        if (response.data.next) await addAlbumsToList(response.data.next)
    } catch (error) { console.log(error.response.status) }
}

async function getAlbums() {
    await addAlbumsToList();
    console.log(albumIds);
}

async function addTracksToList(href = `https://api.spotify.com/v1/me/tracks?limit=10&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } });
        response.data.items.forEach(element => trackIds.push(element.track.id));
        if (response.data.next) await addTracksToList(response.data.next)
    } catch (error) { console.log(error.response.status) }
}

async function getTracks() {
    await addTracksToList();
    console.log(trackIds);
}
//#endregion

//#region MAIN
async function main() {
    await createsGDPlaylist();
    getPlaylists();
    getAlbums();
    getTracks();
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests
    GDPlaylistName,
    GDPlaylistExists,
}
//#endregion