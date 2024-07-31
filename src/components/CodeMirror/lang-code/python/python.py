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

if __name__ == '__main__':
    main()
