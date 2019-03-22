const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const request = require('request');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3009;

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://dev-rafakwolf.auth0.com/.well-known/jwks.json"
    }),
    audience: 'https://teste-api.com',
    issuer: "https://dev-rafakwolf.auth0.com/",
    algorithms: ['RS256']
});

app.use(bodyParser.json({extended: true}));

app.get('/authorized', jwtCheck, function (req, res) {
  res.send('Secured Resource');
});


const ManagementClient = require('auth0').ManagementClient;
const management = new ManagementClient({
    domain: 'dev-rafakwolf.auth0.com',
    clientId: '21CTSCJrXvK7h41r3LSw1iQpnsomdYEp',
    clientSecret: '5SKvGdAFroak4vt0FgQuTZ-ReluCaJn-A6_qblzrcVCYzBA4jAqx7LQ9FUOboyMV',
    scope: 'read:users update:users'
});

const AuthenticationClient = require('auth0').AuthenticationClient;

const auth0 = new AuthenticationClient({
  domain: 'dev-rafakwolf.auth0.com',
  clientId: '21CTSCJrXvK7h41r3LSw1iQpnsomdYEp'
});
  
// 1 - CREATE AN USER
app.post('/api/users', async (req, res) => {
    try {
        const user = {
            connection: 'Username-Password-Authentication',
            email: 'rafakwolf@gmail.com',
            username: 'Rafael',
            password: '1A2b@#3Cd'
        }
        res.status(200).send(await management.createUser(user));
    } catch (err) {
        res.status(500).json(err);
    }
});

// 2 - Generate the access token OR the MFA(Multi Factor Auth) token (JUST ONCE)
app.post('/token', async (req, res) => {
    const data = {
        client_id: '21CTSCJrXvK7h41r3LSw1iQpnsomdYEp',
        client_secret: '5SKvGdAFroak4vt0FgQuTZ-ReluCaJn-A6_qblzrcVCYzBA4jAqx7LQ9FUOboyMV',
        username: 'rafakwolf@gmail.com',
        password: '1A2b@#3Cd',
        grant_type: 'password',
        audience: 'https://teste-api.com',
        connection: 'Username-Password-Authentication'
    };

    auth0.oauth.passwordGrant(data, (err, userData) => {
        if (err) {
          res.status(500).json(err);
        }
        res.status(200).json(userData);
      });
});

// Generate the access token (2FA CODE REQUIRED)
app.post('/mfa/auth', async (req, res) => {

    const mfa_token = req.body.mfa_token;
    const otp = req.body.otp;

    const data = {
        client_id: '21CTSCJrXvK7h41r3LSw1iQpnsomdYEp',
        client_secret: '5SKvGdAFroak4vt0FgQuTZ-ReluCaJn-A6_qblzrcVCYzBA4jAqx7LQ9FUOboyMV',
        username: 'rafakwolf@gmail.com',
        password: '1A2b@#3Cd',
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        audience: 'https://teste-api.com',
        connection: 'Username-Password-Authentication',
        mfa_token,
        otp
    };

    auth0.oauth.passwordGrant(data, (err, userData) => {
        if (err) {
          res.status(500).json(err);
        }
        res.status(200).json(userData);
      });
});


// Generate the QRCode Access and the recovery codes
app.post('/mfa/associate', async (req, res) => {

    const token = req.body.token;

    var options = { method: 'POST',
        url: 'https://dev-rafakwolf.auth0.com/mfa/associate',
        headers: { authorization: 'Bearer '+token },
        body: { authenticator_types: [ 'otp' ] },
        json: true };
  
  request(options, function (error, response, body) {
    if (error) {
        res.status(500).json(error);
    }
    res.status(200).json(body);
  });
});


app.listen(port);