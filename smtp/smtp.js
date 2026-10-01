const { requiredEnv } = require('../config/required-env.cjs');
// Bread and potatoes Express server
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8000;
const priv = '/etc/postfix/ssl/dkim-private.pem';
// Send email to one or multiple recipients:
const sendmail = require('sendmail')({
  logger: {
    debug: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  },
  silent: false,
    /*
  dkim: { // Default: False
    privateKey: fs.readFileSync(priv, 'utf8'),
    keySelector: '._domainkey'//'mydomainkey'
  },*/
  devPort: 587, // Default: False
  devHost: 'localhost', // Default: localhost
  smtpPort: 587, // 2525, // Default: 25
  smtpHost: 'localhost'
});
const error = function(err, reply) {
    console.dir(reply);
};
// Email body
const body = '<p>You activation code is <b>10-' + Math.floor(Math.random()*10000) + '</b> enter it into code confirmation box within next hour to finish registering your account.</p><p><b>Glorious Chimpanzee</b><br/>Thanks from all of our team!</p>';
// Recipient list
const emails = [requiredEnv('SMTP_TEST_RECIPIENT')];
const from_addr = requiredEnv('SMTP_FROM');
const subj = 'Please Confirm Your A Account';
emails.forEach(email => {
    sendmail({from: from_addr,
                to: email,
           subject: subj,
               html: body}, error);
});
// Run basic Express server:
// (You don't even need to do this, if you just want to send email)
let site = 'topicamplify.com';
const key = `/etc/letsencrypt/live/${site}/privkey.pem`;
const cert = `/etc/letsencrypt/live/${site}/fullchain.pem`;
const certificates = {
    "key": fs.readFileSync(key),
    "cert": fs.readFileSync(cert)
};
const server = event => {
    console.log(`${site} is listening on port ${port}!`);
};
// Launch Node server with Express "app"
https.createServer(certificates, app).listen(port, server);
