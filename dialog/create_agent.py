#!/usr/bin/python3
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import dialogflow_v2
import argparse
import logging
import os
import glob
import re
import json
from xmljson import badgerfish as bf, gdata
from lxml.etree import fromstring, tostring
from time import sleep

def init():
    #Read environment variables
    global projectName
    projectName=os.environ["PROJECTNAME"]
    global projectId
    projectId=os.environ["PROJECTID"]
    global agentName
    agentName=os.environ["AGENTNAME"]

    parser = argparse.ArgumentParser()
    parser.add_argument('--resourceDir', dest='resourceDir', type=str, required=True,
                        help="directory containing all resources to help create the agent (intents, entities, etc)")
    parser.add_argument('--lang', dest='lang', type=str, default='en',
                        help="language in which the agent is created")
    parser.add_argument('--loglevel', dest='loglevel', type=str, default='INFO',
                        help="logging level (DEBUG, INFO, WARNING, ERROR or CRITICAL)")
    global args
    args = vars(parser.parse_args())
    logging.basicConfig(level=getattr(logging, args['loglevel'].upper()),
                        format='%(asctime)s %(message)s')
    logging.info("args = %s" % args)


def showAgent():
    logging.debug('Hello')
    client = dialogflow_v2.AgentsClient()
    parent = client.project_path(projectId)
    response = client.export_agent(parent)
    logging.debug('response = ' + str(response))


# Based on https://github.com/dialogflow/dialogflow-python-client-v2/blob/master/samples/intent_management.py
def listIntents():
    intentsClient = dialogflow_v2.IntentsClient()
    parent = intentsClient.project_agent_path(projectId)
    intents = list(intentsClient.list_intents(parent))
    logging.debug('Found {} intent{}'.format(len(intents),'s' if len(intents) != 1 else ''))
    for intent in intents:
        logging.debug('Intent name = {}, display name = {}'.format(intent.name, intent.display_name))


def deleteAllIntents():
    intentsClient = dialogflow_v2.IntentsClient()
    parent = intentsClient.project_agent_path(projectId)
    intents = list(intentsClient.list_intents(parent))
    for intent in intents:
        intentsClient.delete_intent(intent.name)


# Based on https://github.com/dialogflow/dialogflow-python-client-v2/blob/master/samples/entity_type_management.py
def listEntityTypes():
    entityTypesClient = dialogflow_v2.EntityTypesClient()
    parent = entityTypesClient.project_agent_path(projectId)
    entityTypes = entityTypesClient.list_entity_types(parent)

    for entityType in entityTypes:
        entityTypeName = entityType.name
        entityTypeDisplayName = entityType.display_name
        entityTypeId = entityTypeName.split('/')[-1]
        logging.info('Entity type name = {}'.format(entityTypeName))
        logging.info('Entity type Id = {}'.format(entityTypeId))
        logging.info('Entity type display name = {}'.format(entityTypeDisplayName))


def deleteAllEntityTypes():
    entityTypesClient = dialogflow_v2.EntityTypesClient()
    parent = entityTypesClient.project_agent_path(projectId)
    entityTypes = entityTypesClient.list_entity_types(parent)

    for entityType in entityTypes:
        entityTypeName = entityType.name
        entityTypeDisplayName = entityType.display_name
        entityTypeId = entityTypeName.split('/')[-1]
        entityTypePath = entityTypesClient.entity_type_path(projectId, entityTypeId)
        entityTypesClient.delete_entity_type(entityTypePath)
        logging.info('Deleted entity type with display name = {}'.format(entityTypeDisplayName))


def shortName2DisplayName(name):
    try:
        return re.sub(r'\B([A-Z])',r' \1',name)
    except:
        return name


def parseXMLString2Json(phraseAsXMLString):
    xml = fromstring(phraseAsXMLString)
    return gdata.data(xml)


def parseTextOrEntity(elem):
        # Extract text, plus entityType and/or alias if they exist
        text = None
        entityType = None
        alias = None
        if elem[0] == '$t':
            # Pure text, no entity
            text = elem[1]
        else:
            # Entity
            entityType = elem[0]
            text = elem[1]['$t']
            if ('r' in elem[1]):
                alias = elem[1]['r']
            else:
                alias = elem[1]['$t']
            assert(entityType != None), 'No entity found in element {}'.format(json.dumps(elem))
            assert(len(alias) != None), 'No alias found inside entity for element {}'.format(json.dumps(elem))
        assert(len(text) > 0), 'No text found inside entity for element {}'.format(json.dumps(elem))
        return(text, entityType, alias)


def parseTrainingPhrase(phraseAsXMLString):
    sentenceParse = parseXMLString2Json(phraseAsXMLString)
    logging.debug('phraseAsXMLString = "{}"'.format(phraseAsXMLString))
    logging.debug('sentenceParse = "{}"'.format(json.dumps(sentenceParse)))

    parts = []

    for elem in sentenceParse['s'].items():
        logging.debug('elem = "{}"'.format(json.dumps(elem)))
        (text, entityType, alias) = parseTextOrEntity(elem)
        logging.debug('text = "{}"; entityType = "{}"; alias = "{}"'.format(text, entityType, alias))

        if entityType != None:
            part = dialogflow_v2.types.Intent.TrainingPhrase.Part(text=str(text)+str(' '),entity_type=str('@')+str(entityType),alias=alias)
        else:
            part = dialogflow_v2.types.Intent.TrainingPhrase.Part(text=str(text)+str(' '))
        parts.append(part)

    trainingPhrase = dialogflow_v2.types.Intent.TrainingPhrase(parts=parts)

    return trainingPhrase


def getTrainingPhrases(filename):
    result = []
    try:
        with open(filename, encoding='UTF-8') as f:
            for line in f.readlines():
                if line.strip():
                    trainingPhrase = parseTrainingPhrase(line.strip())
                    result.append(trainingPhrase)
        return result
    except FileNotFoundError:
        return result
    else:
        return result


def createIntents():
    intentsClient = dialogflow_v2.IntentsClient()
    parent = intentsClient.project_agent_path(projectId)

    # Walk through the resource files and create the intents from there
    intentsDir = args['resourceDir']+'/intents'
    intentDirnames = os.listdir(intentsDir)
    counter = 1
    for intentDirname in intentDirnames:
        intentDisplayName = shortName2DisplayName(intentDirname)
        logging.info('Starting creation of intent with display name "{}"'.format(intentDisplayName))
        trainingFileName = intentsDir + '/' + intentDirname + '/' + args['lang'] + '/' + 'training.txt'
        trainingPhrases = getTrainingPhrases(trainingFileName)
        logging.debug('Training file "{}" contains {} phrase{}'.format(trainingFileName,
                                                                       len(trainingPhrases),
                                                                       's' if len(trainingPhrases)> 0 else ''))
        # Only parse the *current* intent's training data
        entityDoD = extractEntityTypesValuesAndSynonymsFromTrainingData([intentDirname])
        parameters = []
        for entityTypeName in entityDoD.keys():
            logging.info("entityTypeName = {}".format(entityTypeName))
            parameter = dialogflow_v2.types.Intent.Parameter(display_name = entityTypeName,
                                                             entity_type_display_name = '@'+str(entityTypeName)
                                                             )
            parameters.append(parameter)
        intent = dialogflow_v2.types.Intent(display_name = intentDisplayName,
                                            training_phrases = trainingPhrases,
                                            messages=[],
                                            action='Action_{}'.format(counter)
#                                            parameters=parameters
                                            )
        response = intentsClient.create_intent(parent,intent)
        logging.info('Done creating intent with shortened name "{}"'.format(intentDirname))
        counter += 1

def extractEntityTypesValuesAndSynonymsFromTrainingData(selectedIntentDirnames = []):
    # Returns a dictionary of dictionaries where:
    # Key = entityType (e.g. 'choice'
    # Value = dictionary of
    #         Key = entity reference value (e.g. 'rock')
    #         Value = dictionary of
    #                 Key: synonym (e.g. 'stone')
    #                 Value: count (>= 1)
    entityDictOfDict = {}

    # Walk through the resource files and create the intents from there
    intentDirnames = []
    intentsDir = args['resourceDir']+'/intents'
    if len(selectedIntentDirnames) > 0:
        intentDirnames = selectedIntentDirnames
    else:
        # Select all of them
        intentDirnames = os.listdir(intentsDir)
    for intentDirname in intentDirnames:
        trainingFileName = intentsDir + '/' + intentDirname + '/' + args['lang'] + '/' + 'training.txt'
        try:
            with open(trainingFileName, encoding='UTF-8') as f:
                for line in f.readlines():
                    sentenceParse = parseXMLString2Json(line.strip())
                    for elem in sentenceParse['s'].items():
                        # If it's an entity, not just simple text
                        if elem[0] != '$t':
                            (text, entityType, alias) = parseTextOrEntity(elem)
                            # Populate entityDictOfDict
                            if not entityType in entityDictOfDict:
                                entityDictOfDict[entityType] = {}
                            if not alias in entityDictOfDict[entityType]:
                                entityDictOfDict[entityType][alias] = {}
                            if not text in entityDictOfDict[entityType][alias]:
                                entityDictOfDict[entityType][alias][text] = 1
                            else:
                                entityDictOfDict[entityType][alias][text] += 1

        except FileNotFoundError:
            pass
        else:
            pass
    return entityDictOfDict


# Copied from https://github.com/dialogflow/dialogflow-python-client-v2/blob/master/samples/entity_type_management.py
def _get_entity_type_ids(project_id, display_name):
    entity_types_client = dialogflow_v2.EntityTypesClient()

    parent = entity_types_client.project_agent_path(project_id)
    entity_types = entity_types_client.list_entity_types(parent)
    entity_type_names = [
        entity_type.name for entity_type in entity_types
        if entity_type.display_name == display_name]

    entity_type_ids = [
        entity_type_name.split('/')[-1] for entity_type_name
        in entity_type_names]

    return entity_type_ids


def createEntityTypes(entityDictOfDicts):
    entityTypesClient = dialogflow_v2.EntityTypesClient()
    parent = entityTypesClient.project_agent_path(projectId)
    for entityTypeName in entityDictOfDicts.keys():
        logging.info('entityTypeName = {}'.format(entityTypeName))
        entityDisplayName = re.sub(r'^(@?)(\w+)$',r'\2',entityTypeName)
        entityType = dialogflow_v2.types.EntityType(display_name=entityDisplayName, kind=dialogflow_v2.enums.EntityType.Kind.KIND_MAP)
        response = entityTypesClient.create_entity_type(parent, entityType)
        logging.info('Created entity type with display name "{}"'.format(entityDisplayName))


def createEntities(entityDictOfDicts):
    entityTypesClient = dialogflow_v2.EntityTypesClient()
    for entityTypeName in entityDictOfDicts.keys():
        logging.info('Entity type name = {}'.format(entityTypeName))
        # There should only be one, really
        entityTypeIds = _get_entity_type_ids(projectId, display_name=entityTypeName)
        for entityTypeId in entityTypeIds:
            for entityValue in entityDictOfDicts[entityTypeName].keys():
                synonyms = list(set(entityDictOfDicts[entityTypeName][entityValue]))

                entityTypePath = entityTypesClient.entity_type_path(projectId, entityTypeId)

                entity = dialogflow_v2.types.EntityType.Entity()
                entity.value = entityValue
                entity.synonyms.extend(synonyms)

                response = entityTypesClient.batch_create_entities(entityTypePath, [entity])
                logging.info('Created entity value {} and synonyms {} for entity type {}'.format(entityValue, synonyms, entityTypeName))


if __name__ == "__main__":
    init()
    # It is assumed that the following steps have been performed upfront:
    # - Select or create a Cloud Platform project
    # - Enable billing for the project
    # - Enable the Google Cloud DialogFlow API
    # - Set up authentication
    # see https://github.com/dialogflow/dialogflow-python-client-v2/blob/master/README.rst#before-you-begin
    showAgent()

    listIntents()
    logging.debug('BEFORE intent cleanup')
    deleteAllIntents()
    logging.debug('AFTER intent cleanup')
    listIntents()

    sleep(10)

    listEntityTypes()
    logging.debug('BEFORE entity cleanup')
    deleteAllEntityTypes()
    logging.debug('AFTER entity cleanup')
    listEntityTypes()    

#    entityDictOfDicts = extractEntityTypesValuesAndSynonymsFromTrainingData()
#    logging.info('entityDictOfDicts = "{}"'.format(json.dumps(entityDictOfDicts)))
    
#    createEntityTypes(entityDictOfDicts)
#    createEntities(entityDictOfDicts)

#    createIntents()
