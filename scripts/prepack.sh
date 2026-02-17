#!/bin/bash
mkdir -p dist
npm ci --prod
zip dist/mezmo-cloudwatch.zip -r node_modules/ lib/ config.js index.js package.json
