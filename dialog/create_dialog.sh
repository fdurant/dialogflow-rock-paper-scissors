#!/bin/bash
set -e

RESOURCEDIR=/resources
#LOGLEVEL=DEBUG
LOGLEVEL=INFO
LANGUAGE=en

echo "Starting create_dialog.sh"

#sleep 60
ls -al ${GOOGLE_APPLICATION_CREDENTIALS}
/bin/cat ${GOOGLE_APPLICATION_CREDENTIALS}

echo "Starting create_agent.py"
python3 /create_agent.py --loglevel=${LOGLEVEL} --resourceDir=${RESOURCEDIR} --lang=${LANGUAGE}
echo "Done with create_agent.py"

echo "Starting create_intents.py"
#python3 /create_intents.py
echo "Done with create_intents.py"

echo "Done with create_dialog.sh"
