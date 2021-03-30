
export function toObject(arr, key = undefined) {
  return arr.reduce(function(acc, cur, i) {
    acc[key ? cur[key] : i] = cur;
    return acc;
  }, {});
}

export function extractValueOrDefault(propValue, arg, defaultValue) {
  let propArr;
  if (propValue instanceof String) {
    propArr = propValue.split(' ');
  } else if (Array.isArray(propValue)) {
    propArr = propValue;
  } else {
    return defaultValue;
  }
  const index = propArr.indexOf(arg);
  if (index === -1) {
    for (const item of propArr) {
      if (item.startsWith()) {
        return item.substr(`${arg}=`.length);
      }
    }
  } else {
    return propArr[index + 1];
  }
  return defaultValue;
}

export function getExtension(pathname) {
  const extension = /(?:\.([^.]+))?$/.exec(pathname)[1];
  if (extension) {
    return extension.toLowerCase();
  }
  return extension;
}

export function map2MooshakDifficulty(difficulty) {
  if (!difficulty) {
    return '';
  }
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'VERY_EASY';
    case 'easy':
      return 'EASY';
    case 'average':
      return 'MEDIUM';
    case 'hard':
      return 'DIFFICULT';
    case 'master':
      return 'VERY_DIFFICULT';
  
    default:
      return '';
  }
}
