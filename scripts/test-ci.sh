#!/bin/bash

rm -rf coverage
mkdir -p coverage
tap -Rclassic

code=$?
cat .tap | ./node_modules/.bin/tap-parser -t -f | ./node_modules/.bin/tap-xunit > coverage/test.xml
exit $code
