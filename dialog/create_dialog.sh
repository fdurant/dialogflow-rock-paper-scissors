#!/bin/bash
set -e

DATADIR=/data
INTENTS=${DATADIR}/intents
LOGLEVEL=DEBUG

echo "Starting create_dialog.sh"

#sleep 60
ls -al ${GOOGLE_APPLICATION_CREDENTIALS}
/bin/cat ${GOOGLE_APPLICATION_CREDENTIALS}

echo "Starting create_agent.py"
python3 /create_agent.py --loglevel=${LOGLEVEL}
echo "Done with create_agent.py"

echo "Starting create_intents.py"
#python3 /create_intents.py
echo "Done with create_intents.py"

echo "Done with create_dialog.sh"
