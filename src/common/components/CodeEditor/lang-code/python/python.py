#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json

def main():
    try:
        data = json.loads(sys.argv[1])
        variables = json.loads(sys.argv[2])
    except Exception as e:
        print("error: ", e)
    print(datas)
    print(variables)

def get_value_from_varibales_json(json_data, key_to_find):
    for item in json_data:
        if item['Key'] == key_to_find:
            return item['Value']
    raise KeyError(f"Key '{key_to_find}' not found in the JSON data.")

if __name__ == '__main__':
    main()
