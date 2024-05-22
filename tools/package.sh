#!/bin/bash
mkdir -p pkg
npm ci --prod
zip pkg/mezmo-cloudwatch.zip -r node_modules/ config.js index.js package.json
