# TripViewer

## View and export trip data collected by Automatic

A node.js app that allows users to view and export their trips taken using Automatic.  It uses the Automatic API.

## Demo

A version of this application is available at [https://tripviewer.herokuapp.com](https://tripviewer.herokuapp.com).

## Running

### Install required modules

    npm install

### Configure your client id and client secret

Copy the file `config-sample.json` to `config.json` and add your Automatic client id and client secret.  Alternatively, create environment variables named `AUTOMATIC_CLIENT_ID`, `AUTOMATIC_CLIENT_SECRET`, `AUTOMATIC_AUTHORIZE_URL`, and `AUTOMATIC_AUTH_TOKEN_URL`.

### Run the app

    node index.js

### Deploy to Heroku

The app includes a `Procfile` and `package.json` which will enable [easy deployment to Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-your-application-to-heroku).  If you have the heroku toolbelt installed, you can create, configure and deploy this app in five commands:

    heroku create

    heroku config:add AUTOMATIC_CLIENT_ID="YOUR AUTOMATIC CLIENT ID"
    heroku config:add AUTOMATIC_CLIENT_SECRET="YOUR AUTOMATIC CLIENT SECRET"
    heroku config:add AUTOMATIC_AUTHORIZE_URL=https://www.automatic.com/oauth/authorize/
    heroku config:add AUTOMATIC_AUTH_TOKEN_URL=https://www.automatic.com/oauth/access_token/

    git push heroku master


See [deploying a node.js app](https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-your-application-to-heroku) for more information.

## License

The MIT License (MIT)

Copyright (c) 2013 Automatic Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
