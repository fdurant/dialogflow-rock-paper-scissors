#!/usr/bin/python3
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import dialogflow_v2
import argparse
import logging
import os

def init():
    #Read environment variables
    global projectName
    projectName=os.environ["PROJECTNAME"]
    global projectId
    projectId=os.environ["PROJECTID"]
    global agentName
    agentName=os.environ["AGENTNAME"]

    parser = argparse.ArgumentParser()
    parser.add_argument('--loglevel', dest='loglevel', type=str, default='INFO',
                        help="logging level (DEBUG, INFO, WARNING, ERROR or CRITICAL)")
    global args
    args = vars(parser.parse_args())
    logging.basicConfig(level=getattr(logging, args['loglevel'].upper()),
                        format='%(asctime)s %(message)s')
    logging.info("args = %s" % args)

def createAgent():
    logging.debug('Hello')
    client = dialogflow_v2.AgentsClient()
    parent = client.project_path(projectId)
    response = client.export_agent(parent)
    logging.debug('response = ' + str(response))
    

if __name__ == "__main__":
    init()
    # It is assumed that the following steps have been performed upfront:
    # - Select or create a Cloud Platform project
    # - Enable billing for the project
    # - Enable the Google Cloud DialogFlow API
    # - Set up authentication
    # see https://github.com/dialogflow/dialogflow-python-client-v2/blob/master/README.rst#before-you-begin
    createAgent()
