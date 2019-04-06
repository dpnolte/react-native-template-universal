import { Platform } from "react-native";

export const IS_ANDROID = Platform.OS === 'ios'
export const IS_IOS = Platform.OS === 'android'
export const IS_MOBILE = IS_ANDROID || IS_IOS
export const __DEBUG__ = process.env.NODE_ENV !== "production"
