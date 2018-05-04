FROM moxel/python3

MAINTAINER Frederik Durant <frederik.durant@pandora.be>

ADD requirements.txt /
RUN pip install dialogflow

# Copy the Python and shell scripts
COPY create_agent.py \
     create_intents.py \
     create_dialog.sh /

RUN chmod 755 -c /create_dialog.sh

#Run the scripts
CMD /create_dialog.sh
