# Example call.
set activeKbdLayout to my getActiveKeyboardLayout() # ->, e.g., "U.S."

on getActiveKeyboardLayout()

  # Surprisingly, using POSIX-style paths (even with '~') works with 
  # the `property list file` type.
  set plistPath to "~/Library/Preferences/com.apple.HIToolbox.plist"

  # !! First, ensure that the plist cache is flushed and that the
  # !! *.plist file contains the current value; simply executing
  # !! `default read` against the file - even with a dummy
  # !! key - does that.
  try
    do shell script "defaults read " & plistPath & " dummy"
  end try

  tell application "System Events"

    repeat with pli in property list items of �
      property list item "AppleSelectedInputSources" of �
      property list file plistPath
      # Look for (first) entry with key "KeyboardLayout Name" and return
      # its value.
      # Note: Not all entries may have a 'KeyboardLayout Name' key, 
      # so we must ignore errors.
      try
        return value of property list item "KeyboardLayout Name" of pli
      end try
    end repeat

  end tell
end getActiveKeyboardLayout