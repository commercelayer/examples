export const replaceText = (source, text: string) => {
  return source.replace(`${text} `, "");
};

export const toTitleCase = (text: string) => {
  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
};

export const getSlug = (text: string) => {
  return text.replace(/^(?:https?:\/\/)?/i, "").split(".")[0];
};
