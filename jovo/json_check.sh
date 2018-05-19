#!/bin/bash
set -e

for jsonfile in "$@"
do
    echo "Checking validity of $jsonfile ..."
    python -m json.tool < ${jsonfile}
    echo "OK!"
done
