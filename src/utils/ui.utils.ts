export const getModalBackgroundColor = (
  type: "success" | "error" | "warning" | undefined
): string => {
  switch (type) {
    case "success":
      return "#0f0";
    case "error":
      return "#ff0000";
    case "warning":
      return "#ffa500";
    default:
      return "#0f0";
  }
};
