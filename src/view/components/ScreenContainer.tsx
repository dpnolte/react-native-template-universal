import React, { ReactElement } from 'react'
import { IS_MOBILE, IS_ANDROID } from "../../app/constants";
import { SafeAreaView, StyleSheet, ViewStyle, StyleProp, View, StatusBar } from "react-native";

interface IProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactElement;
  safeArea?: boolean;
}
export const ScreenContainer: React.FunctionComponent<IProps> = (props) => {
  if (props.safeArea && IS_MOBILE) {    
    return (
      <SafeAreaView style={[styles.container, props.style]}>
        {IS_ANDROID ?
          (
            <View style={styles.androidContainer}>
              {props.children}
            </View>
          )
          : props.children
        }
      </SafeAreaView>
    )
  } else {
    return (
      <View style={[styles.container, props.style]}>
        {props.children}
      </View>
    )
  }
}

ScreenContainer.defaultProps = {
  safeArea: true
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  androidContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight
  }
})
