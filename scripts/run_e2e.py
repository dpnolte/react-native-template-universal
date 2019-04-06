# -*- coding: utf-8 -*-

import json
import os
import shlex
import subprocess
import sys
import time


def kill_packager():
    cmd = "pgrep -f 'node node_modules/react-native/local-cli/cli.js "
    cmd += "start --reset-cache'"
    process = subprocess.Popen(
        shlex.split(cmd), stdout=subprocess.PIPE)
    pid, err = process.communicate()
    print("Killing packager")
    subprocess.Popen(shlex.split('kill -9 {}'.format(pid)))
    print("Finished")


current_dir = os.path.dirname(os.path.realpath(__file__))
project_dir = os.path.realpath(current_dir + "/../")
package_json_path = project_dir + "/package.json"
simulator_path = '/Applications/Xcode.app/Contents/Developer/Applications/' + \
    'Simulator.app/Contents/MacOS/Simulator'


if len(sys.argv) > 1:
    jest_config = os.path.realpath(project_dir + '/' + sys.argv[1])
    if os.path.isfile(jest_config) is False:
        raise RuntimeError(
            "Provided argument '{}' is not an existing jest config file.\n" +
            "Remember that it should be a relative path from project root:\n{}"
            .format(sys.argv[1], project_dir))
else:
    jest_config = os.path.realpath(project_dir + '/jest.config.e2e.js')

print('Using jest config file: {}'.format(
    os.path.relpath(jest_config, project_dir)))


force_rebuild = False
offer_choice = False
log_level_trace = False
kill_packager_before_run = len(sys.argv) > 1  # needed for ci
kill_packager_after_run = True
default_choice = 5  # ios 6 debug

# first check if right keyboard layout is set.. needs to be "U.S."
# see: https://github.com/wix/detox/issues/902
cmd = "osascript {}/get_active_keyboard_layout.applescript".format(current_dir)
process = subprocess.Popen(shlex.split(cmd), stdout=subprocess.PIPE)
keyboard_layout, err = process.communicate()
if keyboard_layout.strip() != "U.S.":
    raise RuntimeError("Invalid keyboard layout '{}'.\n" +
                       "Keyboard layout 'U.S.' is required. \n" +
                       "See: https://github.com/wix/detox/issues/902")

with open(package_json_path) as f:
    data = json.load(f)
    detox = data["detox"]
    configurations = detox["configurations"]
    configuration_names = configurations.keys()
    if offer_choice is True:
        print("Select configuration:")
        for i, name in enumerate(configuration_names):
            print("{} - {}".format((i + 1), name))
        configuration_index = input(
            "Choose between 1/{}:".format(len(configuration_names)))
        configuration_index -= 1
    else:
        configuration_index = default_choice - 1

    print(configuration_names)
    selected_configuration_name = configuration_names[configuration_index]
    print("you've selected {}".format(selected_configuration_name))

    config = configurations[selected_configuration_name]
    binary_path = config['binaryPath']
    device_name = config['name']
    print(binary_path)
    print(device_name)

    if kill_packager_before_run is True:
        kill_packager()

    # run packager if needed
    process = subprocess.Popen(
        ["curl", "http://localhost:8081/status"], stdout=subprocess.PIPE)
    out, err = process.communicate()
    if out is None or out.startswith('packager-status:running') is False:
        cmd = 'osascript -e \'tell application "Terminal" to do script "'
        cmd += 'cd {}; '.format(project_dir)
        cmd += 'npm run start -- --reset-cache"\''
        subprocess.Popen(cmd, shell=True)
        print("started packager server")

    is_ios = config['build'].startswith("xcode")

    if is_ios is True:
        print("Assuming iOS configuration")

        # build app if needed
        if force_rebuild is True or os.path.isdir(binary_path) is False:
            print("Binary not yet build, building...")
            subprocess.call(
                ["detox", "build", "-c", selected_configuration_name])
        else:
            print("Binary already build.. skippping build (yaay!)")

        cmd = 'applesimutils --list --byType "{}"'.format(device_name)
        process = subprocess.Popen(shlex.split(cmd), stdout=subprocess.PIPE)
        out, err = process.communicate()
        udid = json.loads(out)[0]["udid"]
        print("UDID: " + udid)

        # open simulator
        process = subprocess.Popen([simulator_path,
                                    '-CurrentDeviceUDID', udid],
                                   stdin=None, stdout=None, stderr=None,
                                   close_fds=True)
        print("opened simulator")

        # wait till booted
        has_booted = False
        while has_booted is False:
            cmd = 'xcrun simctl spawn {} launchctl print system'.format(udid)
            process = subprocess.Popen(
                shlex.split(cmd), stdout=subprocess.PIPE)
            out, err = process.communicate()
            if 'com.apple.springboard.services' in out:
                print('booted')
                has_booted = True
            else:
                # print (out)
                print('.')
                time.sleep(1)  # wait one second before trying againg

        # erase all contents and settings
        cmd = 'osascript ' + current_dir + \
            '/erase_contents_and_settings.applescript'
        os.system(cmd)
        print("erasing all contents and settings")

        # wait till restarted
        time.sleep(1)
        cmd = 'xcrun simctl bootstatus {}'.format(udid)
        subprocess.call(shlex.split(cmd))

        # disable keyboard hardware
        cmd = 'osascript ' + current_dir + '/set_hardware_keyboard.applescript'
        os.system(cmd)
        print("disabled hardware keyboard")

    else:
        print("Assuming Android configuration")
        # build app if needed
        if force_rebuild is True or os.path.isfile(binary_path) is False:
            print("Binary not yet build, building...")
            subprocess.call(
                ["detox", "build", "-c", selected_configuration_name])
        else:
            print("Binary already build.. skippping build (yaay!)")

    print("running test")
    cmd_list = ["detox", "test", "-c", selected_configuration_name,
                "--runner-config", jest_config]
    if log_level_trace is True:
        cmd_list.append("-l")
        cmd_list.append("trace")
    p = subprocess.call(cmd_list)
    if kill_packager_after_run is True:
        kill_packager()
