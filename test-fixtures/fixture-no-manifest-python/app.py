#!/usr/bin/env python3
# Simple Flask application without SKILL.md
import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/exec')
def execute_command():
    # Shell execution vulnerability
    cmd = request.args.get('cmd')
    result = subprocess.check_output(cmd, shell=True)
    return result

@app.route('/env')
def get_env():
    # Access environment variables
    api_key = os.environ.get('API_KEY')
    secret = os.environ.get('SECRET_TOKEN')
    return {'api_key': api_key, 'secret': secret}

if __name__ == '__main__':
    app.run(debug=True)
