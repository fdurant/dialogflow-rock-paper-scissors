FROM node:6.2.0
MAINTAINER Frederik Durant <frederik.durant@pandora.be>

# Prepare app directory
RUN mkdir -p /usr/src/jovo/app /usr/src/jovo/models

# Copy config files for npm and bower
ADD package.json /usr/src/

# Install dependencies
WORKDIR /usr/src/jovo
RUN npm install -g jovo-cli && \
    npm install

# Copy frequently changing app and model files
COPY ./index.js /usr/src/jovo/
COPY ./app/*.js /usr/src/jovo/app/
COPY ./models/*.json /usr/src/jovo/models/

# Build the app and the models
RUN jovo init googleAction && \
    jovo build && \
    jovo deploy

# Expose the app port
EXPOSE 3000

CMD jovo run
