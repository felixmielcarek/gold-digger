//#region REQUIRE
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
//#endregion

//#region VARIABLES
const commonDir = path.join(__dirname, '../common');
const GDPlaylistName = "Gold Digger";
const spotifyRequestsLimit = 50;
const date = new Date();
const currentDate = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')} -${String(date.getDate()).padStart(2, '0')} `;

var GDPlaylistId;
var playlistsIds = [];
var artistIds = [];
var trackIds = [];

var accessToken;
try { accessToken = fs.readFileSync(commonDir + '/spotify_access_token', 'utf8') }
catch (err) { console.error(err) }
//#endregion

//#region CREATE GD PLAYLIST
async function addPlaylistsToDictionary(dictionary, href = `https://api.spotify.com/v1/me/playlists?limit=${spotifyRequestsLimit}&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } })
        response.data.items.forEach(element => dictionary[element.id] = element.name);
        if (response.data.next)
            await addPlaylistsToDictionary(dictionary, response.data.next)
    } catch (error) { webError("Add playlists to dictionnary", error) }
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
    } catch (error) { webError("Get user id", error) }
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
    } catch (error) { webError("Create playlist", error) }
}

async function createsGDPlaylist() {
    var dictionary = {};
    await addPlaylistsToDictionary(dictionary);
    if (!GDPlaylistExists(dictionary)) await createPlaylist();

    //to avoid recovering a second time playlists when getting library
    playlistsIds = Object.keys(dictionary).filter((id) => id !== GDPlaylistId);
}
//#endregion

//#region GET LIBRARY
function addArtistToList(id) {
    if (!artistIds.includes(id) && id != null) artistIds.push(id);
}

async function addPlaylistsArtistsToList(href) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } });
        response.data.items.forEach(element => { element.track.artists.forEach(artist => { addArtistToList(artist.id) }) })
        if (response.data.next) await addPlaylistsArtistsToList(response.data.next);
    } catch (error) { webError("Add playlists artists to list", error) }
}

async function getPlaylistsArtists() {
    for (const playlist of playlistsIds)
        await addPlaylistsArtistsToList(`https://api.spotify.com/v1/playlists/${playlist}/tracks?limit=${spotifyRequestsLimit}&offset=0&fields=items(track(artists(id)))`)
}

async function getAlbumsArtists(href = `https://api.spotify.com/v1/me/albums?limit=${spotifyRequestsLimit}&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } })
        response.data.items.forEach(element => { element.album.tracks.items.forEach(track => track.artists.forEach(artist => addArtistToList(artist.id))) });
        if (response.data.next) await getAlbumsArtists(response.data.next)
    } catch (error) { webError("Get albums artists", error) }
}

async function getTracksArtists(href = `https://api.spotify.com/v1/me/tracks?limit=${spotifyRequestsLimit}&offset=0`) {
    try {
        const response = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } });
        response.data.items.forEach(element => element.track.artists.forEach(artist => addArtistToList(artist.id)));
        if (response.data.next) await getTracksArtists(response.data.next)
    } catch (error) { webError("Get tracks artists", error) }
}

//#endregion

//#region GET TRACKS
function addTracksToList(id) {
    if (!trackIds.includes(id) && id != null) trackIds.push(id);
}

async function getArtistTracks(href) {
    try {
        const artistResponse = await axios.get(href, { headers: { Authorization: 'Bearer ' + accessToken } });
        for (const album of artistResponse.data.items) {
            if (album.release_date === currentDate) {
                try {
                    const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=${spotifyRequestsLimit}&offset=0`, { headers: { Authorization: 'Bearer ' + accessToken } })
                    albumResponse.data.items.forEach(track => addTracksToList(track.id));
                } catch (error) { webError("Get artist tracks", error) }
            }
        }
    } catch (error) { webError("Get artist albums", error) }
}

async function getTracks() {
    for (const artist of artistIds)
        await getArtistTracks(`https://api.spotify.com/v1/artists/${artist}/albums?limit=${spotifyRequestsLimit}&offset=0`);
}
//#endregion

//#region ADD TRACKS
function transformArray(originalArray, x) {
    var transformedArrays = [];
    var tempArray = [];
    originalArray.forEach(function (element, index) {
        tempArray.push("spotify:track:" + element);
        if ((index + 1) % x === 0 || index === originalArray.length - 1) {
            transformedArrays.push(tempArray);
            tempArray = [];
        }
    });
    return transformedArrays;
}

async function addTracksToPlaylist() {
    var x = 100;
    var urisArrays = transformArray(trackIds, x);

    for (const uris of urisArrays) {
        const options = {
            method: 'POST',
            url: `https://api.spotify.com/v1/playlists/${GDPlaylistId}/tracks`,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                'uris': uris
            })
        };
        try { await axios(options) }
        catch (error) { webError("Add tracks to playlist", error) }
    }
}
//#endregion

//#region LOGS
function webError(step, error) {
    console.log(`[KO] ${step} : ${error}`);
    throw new Error();
}

function stepSuccess(step) {
    console.log(`[OK] ${step}`);
}

function stepBeggining(step) {
    const sptor = "=".repeat(5);
    console.log(`\n${sptor} ${step} ${sptor}`);
}

async function stepExecution(stepName, stepFunc) {
    stepBeggining(stepName);
    await stepFunc()
    stepSuccess(stepName);
}
//#endregion

//#region MAIN
async function main() {
    const step1 = "Playlist creation";
    const step2 = "Playlists artists recovery";
    const step3 = "Albums artists recovery";
    const step4 = "Tracks artists recovery";
    const step5 = "Artists tracks recovery";
    const step6 = "Tracks addition";
    try {
        await stepExecution(step1, createsGDPlaylist);
        await stepExecution(step2, getPlaylistsArtists);
        await stepExecution(step3, getAlbumsArtists);
        await stepExecution(step4, getTracksArtists);
        await stepExecution(step5, getTracks);
        await stepExecution(step6, addTracksToPlaylist);
    } catch (error) { }
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