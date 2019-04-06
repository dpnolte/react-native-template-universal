import { __DEBUG__ } from "../constants";

export const log = (message: string) => {
  if (__DEBUG__) {
    console.log(message)
  }
}