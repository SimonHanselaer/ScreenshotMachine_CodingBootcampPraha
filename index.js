//require---------------------------------------------------------

const screenshotmachine = require('screenshotmachine');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

//Google API------------------------------------------------------

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

//Array-----------------------------------------------------------


const websites = [
    {
        id: 1,
        name: 'iFunded',
        url: 'https://ifunded.de/en/'
    },
    {
        id: 2,
        name: 'Property Partner',
        url: 'https://www.propertypartner.co'
    },
    {
        id: 3,
        name: 'Property Moose',
        url: 'https://propertymoose.co.uk'
    },
    {
        id: 4,
        name: 'Homegrown',
        url: 'https://www.homegrown.co.uk'
    },
    {
        id: 5,
        name: 'Realty Mogul',
        url: 'https://www.realtymogul.com'
    }
];

//app-------------------------------------------------------------

{
    const init = () => {
        initScreenShotMachine();
    }

    const initScreenShotMachine = () => {
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            authorize(JSON.parse(content), uploadToDrive);
        });
    }

    const uploadToDrive = auth => {
        const customerKey = '93f2d1';
        secretPhrase = '';

        websites.forEach(website => {
            options = {
                //mandatory parameter
                url: `${website.url}`,
                // all next parameters are optional, see our website screenshot API doc for more details
                dimension: '1920x1080',
                device: 'desktop',
                format: 'jpg',
                cacheLimit: '0',
                delay: '200',
                zoom: '100'
            }

            const apiUrl = screenshotmachine.generateScreenshotApiUrl(customerKey, secretPhrase, options);
            const output = `${website.id}_${website.name}.jpg`;

            screenshotmachine.readScreenshot(apiUrl).pipe(fs.createWriteStream(`./screenshots/${output}`).on('close', function () {
                console.log('Screenshot saved as ' + output);

                const drive = google.drive({ version: 'v3', auth });
                const fileMetadata = {
                    'name': output,
                    parents: ['1WOM_bCJz0GltL1BJdFAflZGvTEBS9RoB']
                };
                const media = {
                    mimeType: 'image/jpeg',
                    body: fs.createReadStream(`./screenshots/${output}`)
                };
                drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, function (err) {
                    if (err) {
                        // Handle error
                        console.error(err);
                    } else {
                        console.log('uploaded file:', output);
                    }
                });
            }));


        })


    }

    init();
}




