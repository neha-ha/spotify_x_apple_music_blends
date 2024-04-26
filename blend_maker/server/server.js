
// initialize packages to use
let express = require('express')
let request = require('request')
let querystring = require('querystring') // deprecated, look into using URLSearchParams instead
let cors = require('cors')
let jwt = require('jsonwebtoken')
//let fs = require('fs')

// initialize Express application
let app = express()

// initialize spotify developer credentials
let redirect_uri = 'http://localhost:8888/callback'
let client_id = '0bd70a80a3c94083b7ee4d8724477141'
let client_secret = '9cf7c074e5f94e2b93b6959edc395e56'

// make site use cors for all requests to our website
app.use(cors())



// -------------- STEP 1: USER AUTHENTICATION (see notes for more explanation) --------------

// spotify

// sets up a route handler for the HTTP GET method on the /login endpoint
// when someone tries to access the /login page of our website, this function will be called to handle the request
app.get('/login', function(request, response) {
    // sends a redirect response to the client's browser, instructing it to go to a diff URL (spotify authorization endpoint)
    response.redirect('https://accounts.spotify.com/authorize?' + 
        // builds a query string that will be appended to the URL
        // contains parameters that spotify needs to authorize the user
        querystring.stringify({
            response_type: 'code', // we want spotify to return a code to us (authorization token)
            client_id: client_id, // need to provide our application's id to spotify
            scope: 'user-top-read user-follow-read playlist-modify-private streaming user-read-email', // permissions we want our app to have
            redirect_uri: redirect_uri // where spotify should send the user after all this
        })
    )
})

// when user completes authorization, spotify redirects to (aka requests the) redirect_uri with query parameters appended to the URL, indluding the authorization code we need
// HTTP GET method route for the /callback (redirect_uri) page
app.get('/callback', function(request, response) {
    let code = request.query.code || null // get the auth code from the request
    
    // set up info that will be used in a POST request to spotify api to exchange auth code for access token
    let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: { // specifies data to be sent in body of POST request
            code: code, // auth code
            redirect_uri: redirect_uri, 
            grant_type: 'authorization_code'
        },
        headers: { // additional headers to include in the request
            // constructs the authorization header w our apps client id and secret 
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json:true // response from spotify should be treated as a json
    }

    // post the request
    request.post(authOptions, function(error, response, body) {
        let access_token = body.access_token // get access token from the response body returned by spotify
        
        let uri = process.env.FRONTED_URI || 'http://localhost:3000/playlist'
        response.redirect(uri + '?access_token=' + access_token) // redirect user to this uri
    })
})


// apple music

// initialize apple developer credentials
const private_key = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg/SIhdz/x7CnUb7Rk
Kc8klTyJI6ovs5unlSIetYEYkbmgCgYIKoZIzj0DAQehRANCAAS9+X5gb70odc97
G4cm7jQEMOp+SSo8ggVGFum0d+19fUeSrGHjKOJ8/cgAkNJFh7RyQ7iZXPuUHrfJ
z2j5EixV
-----END PRIVATE KEY-----`

const team_id = 'VMN4CP5Z72'
const key_id = 'G37FAV4WML'

// generrate a json web token for the user
const token = jwt.sign({}, private_key, {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: team_id,
    header: {
      alg: 'ES256',
      kid: key_id
    }
  });








