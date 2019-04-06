# -*- coding: utf-8 -*-
import os
from string import Template

# HOW TO RUN THIS CONVENIENTLY:
# install visual studio code python extension: https://code.visualstudio.com/docs/languages/python#_install-python-and-the-python-extension
# run command (cmd + shift + P on mac) and type/auto-select: Python: Run Python File in Terminal


def to_camel_case(snake_str):
    components = snake_str.split('_')
    # We capitalize the first letter of each component except the first one
    # with the 'title' method and join them together.
    camel_case = components[0] + ''.join(x.title() for x in components[1:])
    camel_case = camel_case.replace('_', '')
    camel_case = camel_case.replace('-', '')
    return camel_case


current_dir = os.path.dirname(os.path.realpath(__file__))
assets_dir = current_dir + "/../src/assets"

imageExtensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'psd'}
videoExtensions = {'mp4'}
images = []
videos = []
files = os.listdir(assets_dir)
processedNames = {}
for f in files:
    filename, file_extension = os.path.splitext(f)
    file_extension = file_extension[1:].lower()
    if file_extension in imageExtensions:
        name = filename
        if name[0:3].lower() == "ic_":
            name = "icon" + name[3].upper() + name[4:]
        elif name[0:4].lower() == "img_":
            name = name[4:]
        elif name[-4:].lower() == "-ico":
            name = "icon" + name[0].upper() + name[1:-4]
        elif name[-3:].lower() == "@2x":
            name = name[0:-3] + "_size2x"
        var_name = name[0].lower() + to_camel_case(name[1:])
        # it can happen if we have images in different sizes (@2x..)
        if var_name not in processedNames:
            images.append(var_name + " : require('./" +
                          f.replace("@2x", "") + "'),")
            processedNames[var_name] = True
    if file_extension in videoExtensions:
        var_name = filename[0].lower() + to_camel_case(filename[1:])
        videos.append(var_name + " : require('./" + f + "'),")

images.sort()
videos.sort()
template = Template("""
import React from 'react';

// organize assets like this: https://willowtreeapps.com/ideas/react-native-tips-and-tricks-2-0-managing-static-assets-with-absolute-paths/
// This file is auto generated. Do not edit! 🎻
// Run either:
// - ../../scripts/generateAssets.py 💚 💚 💚 
// - 'npm run generate-assets' from project root 💚 💚 💚

export const images = {
  $images
};

export const videos = {
  $videos
};
""")

typescript_contents = template.substitute({
    "images": "\n\t".join(images),
    "videos": "\n\t".join(videos)
})
# print(typescript_contents)
target_file = assets_dir + "/" + "index.ts"
with open(target_file, "w") as dest_file:
    dest_file.write(typescript_contents)

print('updated assets in %s' % target_file)
