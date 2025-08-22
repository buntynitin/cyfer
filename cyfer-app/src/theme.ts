import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "12px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 10px rgba(0,0,0,0.08)",
  },
  components: {
    Button: {
      defaultProps: {
        size: "sm",
        colorScheme: "gray",
        variant: "solid",
      },
    },
    Input: {
      defaultProps: {
        size: "sm",
        variant: "outline",
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: "md",
        },
      },
    },
  },
});

export default theme; 