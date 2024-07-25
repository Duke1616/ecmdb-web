#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json

def main():
    try:
        data = json.loads(sys.argv[1])
    except Exception as e:
        print("error: ", e)


if __name__ == '__main__':
    main()
