const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


///CRUD LABELS

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

//create a label

function createLabels(auth, labelName) {
 const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.create({
    userId: 'me',
    resource: {
      name: labelName,
      messageListVisibility: 'show',
      labelListVisibility: 'labelShow',
    },
  }, (err, res) => {
    if (err) {
      return console.log('The API returned an error: ' + err );
    } else {
      console.log(res.data);
    }
  });
}

//delete a label

function deleteLabels(auth, labelId) {
  const gmail = google.gmail({version: 'v1', auth});
  return console.log('The API returned an error: ' + err );
    gmail.users.labels.delete({
      userId: 'me',
      id: labelId,
    }, (err, res) => {
      if (err) {
      } else {
        console.log(res.data);
      }
    });
  }

//update a label

function updateLabels(auth, labelId ,labelName) {
  const gmail = google.gmail({version: 'v1', auth});
    gmail.users.labels.update({
      userId: 'me',
      id: labelId,
      resource: {
        name: labelName,
        messageListVisibility: 'show',
        labelListVisibility: 'labelShow',
      },
    }, (err, res) => {
      if (err) {
        return console.log('The API returned an error: ' + err );
      } else {
        console.log(res.data);
      }
    });
  }

///CRUD MESSAGES TO LABELS

//add email to label
function labelMessagesFrom(auth, email, labelId) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.list({
    userId: 'me',
    q: `from:${email}`
  }, (err, res) => {
    if (err) return console.log(`The API returned an error: ${err}`);
    const messages = res.data.messages;
    if (messages.length) {
      console.log(`Adding label to ${messages.length} messages from ${email}`);
      messages.forEach((message) => {
        gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          resource: {
            addLabelIds: [labelId],
          },
        }, (error) => {
          if (error) return console.log(`The API returned an error: ${error}`);
          console.log(`Label added to message ${message.id}`);
        });
      });
    } else {
      console.log('No messages found.');
    }
  });
}

//remove email to label

function unlabelMessagesFrom(auth, email, labelId) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.list({
    userId: 'me',
    q: `from:${email}`
  }, (err, res) => {
    if (err) return console.log(`The API returned an error: ${err}`);
    const messages = res.data.messages;
    if (messages.length) {
      console.log(`Removing label to ${messages.length} messages from ${email}`);
      messages.forEach((message) => {
        gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          resource: {
            removeLabelIds: [labelId],
          },
        }, (error) => {
          if (error) return console.log(`The API returned an error: ${error}`);
          console.log(`Label removed to message ${message.id}`);
        });
      });
    } else {
      console.log('No messages found.');
    }
  });
}

//main function

async function main() {
  const auth = await authorize();
  // listLabels(auth);
  //createLabels(auth, 'final');
  //deleteLabels(auth, 'Label_4');
  //updateLabels(auth, 'Label_2', 'changename');
  //labelMessagesFrom(auth, 'guillaume.prigent92@gmail.com', 'Label_2')
}

main().catch(console.error);