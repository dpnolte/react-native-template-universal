# -*- coding: utf-8 -*-
import os
import datetime

# HOW TO RUN THIS CONVENIENTLY:
# install visual studio code python extension: https://code.visualstudio.com/docs/languages/python#_install-python-and-the-python-extension
# run command (cmd + shift + P on mac) and type/auto-select: Python: Run Python File in Terminal
# OR: from terminal @ project root: npm run generate-indexes

# RUN SETTINGS:
apply_recursively = True
run_at_target_dir = False
current_dir = os.path.dirname(os.path.realpath(__file__))
target_dir = os.path.join(current_dir, "..", "src")
blacklist = set(['routing'])


def create_index_ts_at_dir(dir, level):
    files = os.listdir(dir)
    tsFileExtensions = {'ts', 'tsx'}
    typescript_contents = "// Auto generated\n"
    typescript_contents += "// Do not edit!!\n"
    prefix = '../../'
    if level > 0:
        prefix = ''
        for i in range(level+1):
            if i > 0:
                prefix += '../'
    any_exports = False
    typescript_contents += '// Run either: \n' 
    typescript_contents += '// - ' + prefix + 'scripts/generateIndexes.py 💚 💚 💚 \n'
    typescript_contents += '// - \'npm run generate-indexes\' '
    typescript_contents += 'from project root 💚 💚 💚\n\n'
    for f in files:
        filename, file_extension = os.path.splitext(f)
        file_extension = file_extension[1:].lower()
        if file_extension in tsFileExtensions:
            if filename != 'index':
                typescript_contents += "export * from './%s';\n" % filename
                any_exports = True

    if any_exports == True:
      target_path = dir + os.sep + 'index.ts'
      with open(target_path, 'w') as dest_file:
         dest_file.write(typescript_contents)
      print('updated exports in %s' % target_path)


def apply_to_dirs(root_dir, apply):
    rootLevel = len(root_dir.split(os.sep))
    for root, dirs, files in os.walk(root_dir):
        level = len(root.split(os.sep)) - rootLevel
        last_parth_of_path =  os.path.basename(os.path.normpath(root))
        if last_parth_of_path not in blacklist and (run_at_target_dir is True or level > 0):
            apply(root, level)


# RUN
if apply_recursively is True:
    apply_to_dirs(target_dir, lambda d, l: create_index_ts_at_dir(d, l))
else:
    create_index_ts_at_dir(target_dir, 0)
