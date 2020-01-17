const RulesEngine = require('./rulesEngine')
const fs = require('fs')
// var path = require('path')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const accessFileAsync = promisify(fs.access)
const copyFileAsync = promisify(fs.copyFile)
const readDirAsync = promisify(fs.readdir)
const deleteFileAsync = promisify(fs.unlink)
const customLogger = require('./requestLogger')
// const _ = require('lodash')

const rulesValidationFilePathPrefix = 'spec_files/rules_validation/'
const rulesCallbackFilePathPrefix = 'spec_files/rules_callback/'

const DEFAULT_RULES_FILE_NAME = 'default.json'
const ACTIVE_RULES_FILE_NAME = 'activeRules.json'
const CONFIG_FILE_NAME = 'config.json'

var validationRules = null
var callbackRules = null

var validationRulesEngine = null
var callbackRulesEngine = null

var activeValidationRulesFile = null
var activeCallbackRulesFile = null

const reloadValidationRules = async () => {

  const rulesConfigRawData = await readFileAsync(rulesValidationFilePathPrefix + CONFIG_FILE_NAME)
  let rulesConfig = JSON.parse(rulesConfigRawData)

  try {
    await accessFileAsync(rulesValidationFilePathPrefix + rulesConfig.activeRulesFile, fs.constants.F_OK)
  } catch (err) {
    // If active rules file not found then make default rules file as active
    await setActiveValidationRulesFile(DEFAULT_RULES_FILE_NAME)
  }
  activeValidationRulesFile = rulesConfig.activeRulesFile
  customLogger.logMessage('info', 'Reloading Validation Rules from file ' + rulesConfig.activeRulesFile, null, false)
  const rulesRawdata = await readFileAsync(rulesValidationFilePathPrefix + rulesConfig.activeRulesFile)
  validationRules = JSON.parse(rulesRawdata)
  validationRulesEngine = new RulesEngine()
  console.log('GVK1', validationRules)
  if (!validationRules.length) {
    validationRules = []
  }
  validationRulesEngine.loadRules(validationRules)
}

const reloadCallbackRules = async () => {

  const rulesConfigRawData = await readFileAsync(rulesCallbackFilePathPrefix + CONFIG_FILE_NAME)
  let rulesConfig = JSON.parse(rulesConfigRawData)

  try {
    await accessFileAsync(rulesCallbackFilePathPrefix + rulesConfig.activeRulesFile, fs.constants.F_OK)
  } catch (err) {
    // If active rules file not found then make default rules file as active
    await setActiveCallbackRulesFile(DEFAULT_RULES_FILE_NAME)
  }
  activeCallbackRulesFile = rulesConfig.activeRulesFile
  customLogger.logMessage('info', 'Reloading Callback Rules from file ' + rulesConfig.activeRulesFile, null, false)
  const rulesRawdata = await readFileAsync(rulesCallbackFilePathPrefix + rulesConfig.activeRulesFile)
  callbackRules = JSON.parse(rulesRawdata)
  callbackRulesEngine = new RulesEngine()
  if (!callbackRules.length) {
    callbackRules = []
  }
  callbackRulesEngine.loadRules(callbackRules)
}

const setActiveValidationRulesFile = async (fileName) => {
  const rulesConfig = {
    activeRulesFile: fileName
  }
  await writeFileAsync(rulesValidationFilePathPrefix + CONFIG_FILE_NAME, JSON.stringify(rulesConfig, null, 2))
  activeValidationRulesFile = fileName
  await reloadValidationRules()
}

const setActiveCallbackRulesFile = async (fileName) => {
  const rulesConfig = {
    activeRulesFile: fileName
  }
  await writeFileAsync(rulesCallbackFilePathPrefix + CONFIG_FILE_NAME, JSON.stringify(rulesConfig, null, 2))
  activeCallbackRulesFile = fileName
  await reloadCallbackRules()
}

const getValidationRules = async () => {
  if (!validationRules) {
    await reloadValidationRules()
  }
  return validationRules
}

const getCallbackRules = async () => {
  if (!callbackRules) {
    await reloadCallbackRules()
  }
  return callbackRules
}

// const setValidationRules = async (rules) => {
//   validationRules = rules
//   validationRulesEngine = new RulesEngine()
//   validationRulesEngine.loadRules(rules)
//   customLogger.logMessage('info', 'Reloaded the validation rules', null, false)
//   await writeFileAsync(rulesValidationFilePathPrefix + ACTIVE_RULES_FILE_NAME, JSON.stringify(rules, null, 2))
// }

// const setCallbackRules = async (rules) => {
//   callbackRules = rules
//   callbackRulesEngine = new RulesEngine()
//   callbackRulesEngine.loadRules(rules)
//   customLogger.logMessage('info', 'Reloaded the callback rules', null, false)
//   await writeFileAsync(rulesCallbackFilePathPrefix + ACTIVE_RULES_FILE_NAME, JSON.stringify(rules, null, 2))
// }

const getValidationRulesEngine = async () => {
  if (!validationRulesEngine) {
    validationRulesEngine = new RulesEngine()
    const rules = await getValidationRules()
    validationRulesEngine.loadRules(rules)
  }
  return validationRulesEngine
}

const getCallbackRulesEngine = async () => {
  if (!callbackRulesEngine) {
    callbackRulesEngine = new RulesEngine()
    const rules = await getCallbackRules()
    callbackRulesEngine.loadRules(rules)
  }
  return callbackRulesEngine
}

const getValidationRulesFiles = async () => {
  await getValidationRules()
  try {
    const files = await readDirAsync(rulesValidationFilePathPrefix)
    const resp = {}
    // Do not return the config file
    resp.files = files.filter(item => {
      return (item !== CONFIG_FILE_NAME)
    })
    resp.activeRulesFile = activeValidationRulesFile
    return resp
  } catch (err) {
    return null
  }
}

const getValidationRulesFileContent = async (fileName) => {
  try {
    const rulesRawdata = await readFileAsync(rulesValidationFilePathPrefix + fileName)
    return JSON.parse(rulesRawdata)
  } catch (err) {
    return err
  }
}

const setValidationRulesFileContent = async (fileName, fileContent) => {
  try {
    await writeFileAsync(rulesValidationFilePathPrefix + fileName, JSON.stringify(fileContent, null, 2))
    await reloadValidationRules()
    return true
  } catch (err) {
    return err
  }
}

const deleteValidationRulesFile = async (fileName) => {
  try {
    await deleteFileAsync(rulesValidationFilePathPrefix + fileName)
    await reloadValidationRules()
    return true
  } catch (err) {
    return err
  }
}

const getCallbackRulesFiles = async () => {
  await getCallbackRules()
  try {
    const files = await readDirAsync(rulesCallbackFilePathPrefix)
    const resp = {}
    // Do not return the config file
    resp.files = files.filter(item => {
      return (item !== CONFIG_FILE_NAME)
    })
    resp.activeRulesFile = activeCallbackRulesFile
    return resp
  } catch (err) {
    return null
  }
}

const getCallbackRulesFileContent = async (fileName) => {
  try {
    const rulesRawdata = await readFileAsync(rulesCallbackFilePathPrefix + fileName)
    return JSON.parse(rulesRawdata)
  } catch (err) {
    return err
  }
}

const setCallbackRulesFileContent = async (fileName, fileContent) => {
  try {
    await writeFileAsync(rulesCallbackFilePathPrefix + fileName, JSON.stringify(fileContent, null, 2))
    await reloadCallbackRules()
    return true
  } catch (err) {
    return err
  }
}

const deleteCallbackRulesFile = async (fileName) => {
  try {
    await deleteFileAsync(rulesCallbackFilePathPrefix + fileName)
    await reloadCallbackRules()
    return true
  } catch (err) {
    return err
  }
}

module.exports = {
  getValidationRulesEngine,
  getCallbackRulesEngine,
  getValidationRules,
  getCallbackRules,
  // setValidationRules,
  // setCallbackRules,
  getValidationRulesFiles,
  getValidationRulesFileContent,
  setValidationRulesFileContent,
  deleteValidationRulesFile,
  getCallbackRulesFiles,
  getCallbackRulesFileContent,
  setCallbackRulesFileContent,
  deleteCallbackRulesFile,
  setActiveValidationRulesFile,
  setActiveCallbackRulesFile
}
