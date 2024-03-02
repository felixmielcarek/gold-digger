# gold-digger

## Get started

Create the environment variables file:

```shell
touch common/.env
```

In this file add the two environment variables necessary to the project:

```
CLIENT_ID=[spotify_app_id]
CLIENT_SECRET=[spotify_app_secret]
```

These 2 values can be found in the Spotify developer dashboard as described in the [Spotify documentation](https://developer.spotify.com/documentation/web-api/tutorials/getting-started#create-an-app).

Start the web application:

```shell
node --env-file=common/.env web/src/app.js
```

Start your browser, go to url: ```localhost:3000``` and login with your Spotify account to recover your access token.

## Run the script

```shell
node script/app.js
```

## Run the tests

```shell
cd script && npm test && cd ..
```