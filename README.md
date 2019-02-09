# Drone Config Plugin - Pipeline

Drone only allows for a single `YAML_ENDPOINT` to be defined, which means you can only use one config plugin. This plugin aims to solve that issue by forming a "pipeline" of plugins, with the YAML generated from one plugin, passed on to the next one in series, so that each plugin can be responsible for its own functionality.

This plugin works by:

1. Capturing the incoming data from drone
2. Fetching the .drone.yml file from the repo if it exists
3. Combining the data from drone with the fetched yaml (by adding `yaml` property to the data)
4. POSTing the combined data to each of the defined `PLUGIN_ENDPOINTS` in series, replacing the `yaml` property with the YAML returned from each endpoint, before sending it on to the next one.
5. Once the final endpoint has been called, the final combined YAML is sent back to drone

Due to the way this plugin works, not all config-plugins will be compatible out of the box (they must support the `yaml` input value). Please see below for a list of known compatible plugins.

## Installation

PLEASE NOTE: At the moment it supports only github.com installations.

Generate a GitHub access token with repo permission. This token is used to fetch the `.drone.yml` file.

Generate a shared secret key. This key is used to secure communication between the server and agents. The secret should be 32 bytes.
```
$ openssl rand -hex 16
558f3eacbfd5928157cbfe34823ab921
```

Run the container somewhere where the drone server can reach it (note: the order of endpoints matters):

```
docker run \
  -p ${PLUGIN_PORT}:3000 \
  -e PLUGIN_SECRET=558f3eacbfd5928157cbfe34823ab921 \
  -e PLUGIN_ENDPOINTS="https://abc.com:3000,https://def.com:3000" \
  -e GITHUB_TOKEN=GITHUB8168c98304b \
  --name drone-plugin-pipeline \
  microadam/drone-config-plugin-pipeline
```

Update your drone server with information about the plugin:

```
-e DRONE_YAML_ENDPOINT=http://${PLUGIN_HOST}:${PLUGIN_PORT}
-e DRONE_YAML_SECRET=558f3eacbfd5928157cbfe34823ab921
```

See [the official docs](https://docs.drone.io/extend/config) for extra information on installing a Configuration Provider Plugin.

## Supported Plugins

Below are a list of config plugins that are known to be compatible with this plugin. If you know of any that are missing, please open a PR.

[Changeset Conditional](https://github.com/microadam/drone-config-changeset-conditional)