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
    apt-get install -y google-cloud-sdk

# Set up authorizations for Google Cloud
# Inspired by https://stackoverflow.com/questions/37428287/not-able-to-perform-gcloud-init-inside-dockerfile
# Hack: first we copy the file to a temporary location
COPY ./${GOOGLE_APPLICATION_CREDENTIALS_SOURCE} /usr/src/jovo/
# And then we use it and remove it again
RUN gcloud auth activate-service-account --key-file /usr/src/jovo/"$GOOGLE_APPLICATION_CREDENTIALS_SOURCE" && \
    rm -f /usr/src/jovo/"$GOOGLE_APPLICATION_CREDENTIALS_SOURCE" && \
    gcloud config set project "$PROJECTID"

# Prepare app directory
RUN mkdir -p /usr/src/jovo/app/i18n /usr/src/jovo/models

# Copy config files for npm and bower
ADD ${DIRNAME}/package.json /usr/src/

# Install dependencies
WORKDIR /usr/src/jovo
RUN npm install -g jovo-cli && \
    npm install

# Copy frequently changing app and model files
COPY ${DIRNAME}/index.js /usr/src/jovo/
COPY ${DIRNAME}/app/*.js /usr/src/jovo/app/
COPY ${DIRNAME}/app/i18n/*.json /usr/src/jovo/app/i18n/
COPY ${DIRNAME}/models/*.json /usr/src/jovo/models/

# Build the app and the models
# create dialogflow_agent.zip locally
# copy the file to Google Cloud Storage
# and import it into the DialogFlow agent via the DialogFlow Rest API
RUN jovo init googleAction && jovo build && jovo deploy && \
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

# Expose the app port
EXPOSE 3000

CMD jovo run
