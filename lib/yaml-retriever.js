const { promisify } = require('util')
const getYaml = gh => async data => {
  const options = {
    user: data.repo.namespace,
    repo: data.repo.name,
    ref: data.build.ref,
    path: data.repo.config_path
  }
  const file = await promisify(gh.repos.getContent)(options)
  return Buffer.from(file.content, 'base64').toString()
}

module.exports = getYaml