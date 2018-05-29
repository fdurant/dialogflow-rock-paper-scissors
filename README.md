# Rock-paper-scissors for DialogFlow

This project contains an implementation of the Rock-Paper-Scissor
game for [Google Actions](https://developers.google.com/actions/) and
[Google Dialogflow](https://dialogflow.com/). The fulfillment backend
runs as a [Google Function](https://cloud.google.com/functions/).

The chatbot application is written in the cross-platform [Jovo Framework](https://www.jovo.tech/).

The primary goal of this project was not to implement a game, but to
_learn_ about Google DialogFlow, Actions, Functions and Jovo Framework.

## Limitation
Although this could be added relatively easy, there is currently
no support to run this application as an Alexa Skill.

## Prerequisites for building, running and deploying

In order to build this application and deploy it your own Google Cloud
environment, here's what you need:

- [Docker Community Edition](https://docs.docker.com/install/) >=  version 17.03.0-ce
- [docker-compose](https://docs.docker.com/compose/) >= 1.11.2
- a [Google Cloud](https://cloud.google.com/) account, plus
  - a predefined [Dialogflow](https://dialogflow.com/) Agent
  - a predefined [Google
  - Function](https://cloud.google.com/functions/)
  - all necessary Google API and Billing requirements fulfilled
  - a working service_account.json file, downloaded from [Google IAM &
    Admin](https://console.cloud.google.com/iam-admin/) into _/mydownloads_

## Code preparation
```
[~]$ mkdir mydir
[~]$ cd mydir
[mydir]$ git clone https://github.com/fdurant/dialogflow-rock-paper-scissors.git
[mydir]$ cp /mydownloads/service_account.json .
[mydir]$ pico .env (see immediately below)
```

## Structure of the _.env_ file inside _mydir_
```
PROJECTNAME=<projectname>
PROJECTID=<projectid>
AGENTNAME=<agentname>
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/google_service_account.json
```

where 
- &lt;projectname&gt; is the name of the Google Cloud Project containing the Dialogflow agent
- &lt;projectid&gt; is the identifier of the Google Cloud Project containing the Dialogflow agent
- &lt;agentname&gt; is the name of the Dialogflow Agent

## Build, package, deploy and run the application on Google Cloud
```
[mydir]$ docker-compose up -d --build jovo
```

To force a redeployment, even when no application code has changed:
```
[mydir]$ FORCERERUNFROMHERE=`date -Iseconds` docker-compose up -d --build jovo
```