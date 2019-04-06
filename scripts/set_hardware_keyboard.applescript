tell application "Simulator"
    activate
end tell
tell application "System Events"
    set hwKB to value of attribute "AXMenuItemMarkChar" of menu item "Connect Hardware Keyboard" of menu 1 of menu item "Keyboard" of menu 1 of menu bar item "Hardware" of menu bar 1 of application process "Simulator"
    if ((hwKB as string) is equal to "missing value") then
        do shell script "echo hardware keyboard is off"
    else
        click menu item "Connect Hardware Keyboard" of menu 1 of menu item "Keyboard" of menu 1 of menu bar item "Hardware" of menu bar 1 of application process "Simulator"
    end if
end tell