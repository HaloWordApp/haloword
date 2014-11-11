#!/bin/bash

echo Distributing the extension...
zip -r ~/Desktop/haloword.zip . -x '.*/*' '.*' '*.sh'
echo Distribution file created at ~/Desktop/haloword.zip
