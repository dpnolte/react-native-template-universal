tell application "Simulator"
    activate
end tell
tell application "System Events"
    # erase all content and settings...
    click menu item "Erase All Content and Settings…" of menu 1 of menu bar item "Hardware" of menu bar 1 of application process "Simulator"
    key code 36
end tell