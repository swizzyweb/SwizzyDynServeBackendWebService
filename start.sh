#!/bin/bash
script_dir=$(dirname "$0")
if [ -n "$1" ];
then

	export port=$1
fi

cd $script_dir
npm run server
