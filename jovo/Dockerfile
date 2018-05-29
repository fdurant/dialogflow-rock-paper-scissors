FROM node:10.1
ARG PROJECTID
ARG GOOGLE_APPLICATION_CREDENTIALS_SOURCE
ENV DIRNAME ./jovo
ENV PROJECTID ${PROJECTID}
ENV GOOGLE_APPLICATION_CREDENTIALS_SOURCE ${GOOGLE_APPLICATION_CREDENTIALS_SOURCE}
MAINTAINER Frederik Durant <frederik.durant@pandora.be>

# Install extra packages
# Inspired by https://cloud.google.com/sdk/downloads#apt-get
RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk-stretch main" | \
    tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

RUN apt-get update && \
    apt-get install -y zip unzip && \
    apt-get install -y google-cloud-sdk && \
    mkdir -p /usr/src/jovo/app/i18n /usr/src/jovo/models

# Set up authorizations for Google Cloud
# Inspired by https://stackoverflow.com/questions/37428287/not-able-to-perform-gcloud-init-inside-dockerfile
# Hack: first we copy the file to a temporary location
COPY ./${GOOGLE_APPLICATION_CREDENTIALS_SOURCE} /usr/src/jovo/
# And then we use it and remove it again
RUN gcloud auth activate-service-account --key-file /usr/src/jovo/"$GOOGLE_APPLICATION_CREDENTIALS_SOURCE" && \
    rm -f /usr/src/jovo/"$GOOGLE_APPLICATION_CREDENTIALS_SOURCE" && \
    gcloud config set project "$PROJECTID"

# Copy config files for npm and bower
ADD ${DIRNAME}/package.json /usr/src/

# Install dependencies
WORKDIR /usr/src/jovo
RUN npm init -y && \
    npm install -g jovo-cli --save && \
    npm install -g json && \
    npm install -g yamljs && \
    npm install jovo-framework --save && \
    npm install sprintf-js --save && \
    npm install assert --save && \
    npm install jsonpath --save && \
    npm install && \
    cat package.json

# Copy frequently changing app and model files
COPY ${DIRNAME}/index.js /usr/src/jovo/
COPY ${DIRNAME}/app/i18n/*.json /usr/src/jovo/app/i18n/
COPY ${DIRNAME}/models/*.json /usr/src/jovo/models/
COPY ${DIRNAME}/app/*.js /usr/src/jovo/app/
COPY ${DIRNAME}/*.sh /usr/src/jovo/

# Syntax check on all JSON files
RUN chmod +x /usr/src/jovo/json_check.sh && \
    /usr/src/jovo/json_check.sh /usr/src/jovo/app/i18n/*.json /usr/src/jovo/models/*.json

# To force Docker to start (re)building at least here, run this on the command line:
# sudo FORCERERUNFROMHERE=`date -Iseconds` docker-compose up -d --build jovo
ARG FORCERERUNFROMHERE

# 1) Build the app and the models
# 2) create fulfillment.zip locally, copy it to Google Cloud Storage, and deploy it as a Google Function 
# 3) create dialogflow_agent.zip locally, copy it to Google Cloud Storage
#    and import it into the DialogFlow agent via the DialogFlow Rest API
RUN echo ${FORCERERUNFROMHERE} && \
    jovo init googleAction && jovo build && \
    zip fulfillment.zip ./index.js ./package.json ./app ./app.json ./models && \
    gsutil cp fulfillment.zip gs://${PROJECTID}.appspot.com/ && \
    gsutil ls -al gs://${PROJECTID}.appspot.com/fulfillment.zip && \
    gcloud beta functions deploy index --trigger-http | tee functions_config.yaml && \
    cat functions_config.yaml && \
    yaml2json functions_config.yaml > functions_config.json && \
    cat functions_config.json && \
    NEWURL=`json httpsTrigger.url < functions_config.json` && \
    json -I -f platforms/googleAction/dialogflow/agent.json -e this.webhook.url="\"${NEWURL}\"" && \    
    cat platforms/googleAction/dialogflow/agent.json && \
    jovo deploy && \
    gsutil cp platforms/googleAction/dialogflow_agent.zip gs://${PROJECTID}.appspot.com/ && \
    gsutil ls -al gs://${PROJECTID}.appspot.com/dialogflow_agent.zip && \
    curl \ 
      https://dialogflow.googleapis.com/v2beta1/projects/${PROJECTID}/agent:import \ 
      -X POST \ 
      -H 'Authorization: Bearer '$(gcloud auth print-access-token) \ 
      -H 'Accept: application/json' \ 
      -H 'Content-Type: application/json' \
      --compressed \ 
      --data-binary "{ 'agentUri': 'gs://${PROJECTID}.appspot.com/dialogflow_agent.zip'}"    

# No more need to run this locally, since we've moved the fulfillment function to Google Functions
#CMD jovo run
