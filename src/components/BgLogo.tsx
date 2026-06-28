import React from "react";
import { Image, StyleSheet } from "react-native";

export default function BgLogo() {
  return (
    <Image
      source={require("../../assets/icons/appicon.png")}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    position: "absolute",
    width: 340,
    height: 340,
    opacity: 0.2,
    alignSelf: "center",
    top: "20%",
  },
});
