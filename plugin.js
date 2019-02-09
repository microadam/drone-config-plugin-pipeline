const express = require('express')
const bodyParser = require('body-parser')
const GhApi = require('github4')
const request = require('request')
const { promisify } = require('util')
const createYamlRetriever = require('./lib/yaml-retriever')
const isValidSig = require('./lib/signature-validator')

const githubToken = process.env.GITHUB_TOKEN
const sharedKey = process.env.PLUGIN_SECRET
const endpointsString = process.env.PLUGIN_ENDPOINTS

const gh = new GhApi({ version: '3.0.0' })
gh.authenticate({ type: 'oauth', token: githubToken })

const getYaml = createYamlRetriever(gh)

const app = express()
app.post('/', bodyParser.json(), async (req, res) => {
  console.log('Processing...')
  if (!req.headers.signature) return res.status(400).send('Missing signature')
  if (!isValidSig(req, sharedKey)) return res.status(400).send('Invalid signature')
  if (!req.body) return res.sendStatus(400)
  const data = req.body

  let yaml = null
  try {
    yaml = await getYaml(data)
  } catch (e) {
    if (e.code !== 404) {
      console.log('ERROR:', e)
      return res.sendStatus(500)
    }
  }

  const headers = { ...req.headers, 'content-length': undefined }
  const endpoints = endpointsString.split(',')
  let hasErrored = false

  for (let url of endpoints) {
    console.log('Requesting:', url)
    data.yaml = yaml
    const options = { url, method: 'POST', headers: headers, json: data }
    let response = null
    try {
      response = await promisify(request)(options)
    } catch (e) {
      console.log('ERROR:', e)
      hasErrored = true
      break
    }
    const statusCode = response.statusCode
    console.log(url, 'response:', statusCode)
    if (statusCode === 200) {
      yaml = response.body.Data
    } else if (statusCode >= 500) {
      hasErrored = true
      break
    }
  }
  if (hasErrored) {
    console.log('Error in processing pipeline. Please check individual plugins for cause of error')
    return res.sendStatus(500)
  }
  res.json({ Data: yaml })
})

app.listen(3000)