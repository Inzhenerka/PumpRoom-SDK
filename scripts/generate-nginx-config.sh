#!/bin/sh
set -eu
mkdir -p /tmp/pumproom
PUMPROOM_SDK_PATH_PREFIX='' envsubst '${PUMPROOM_SDK_PATH_PREFIX}' \
  < /etc/nginx/pumproom/sdk/app.conf.template > /tmp/pumproom/sdk.conf
