
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

export function map2MooshakType(type) {
  if (!type) {
    return 'CODE';
  }
  switch (type.toLowerCase()) {
    case 'extension':
      return 'CODE';
    case 'improvement':
      return 'CODE';
    case 'bug_fix':
      return 'CODE';
    case 'fill_in_gaps':
      return 'FILL_IN_GAPS';
    case 'sort_blocks':
      return 'SORT_BLOCKS';
    case 'spot_bug':
      return 'SPOT_BUG';
  
    default:
      return 'CODE';
  }
}

export function applyTemplate(template, code = '') {
  let match;
  while ((match = /^([\ ]*){{[\ ]*code[\ ]*}}/gim.exec(template))) {
    const indent = match[1];
    template = template.replace(match[0], indentString(code, indent.length));
  }
  while ((match = /{{[\ ]*code[\ ]*}}/gi.exec(template))) {
    template = template.replace(match[0], code);
  }
  return template;
}

export function correctorFrom(commands, dynamic) {
  let corrector = `#!/bin/sh

${correctorVariables(dynamic)}

res=0
mark=128
`;
  for (const command of commands) {
    corrector = corrector + `
${command}
status=$?
if [ $status -gt $res ]
then
  if [ $status -gt 127 ]
  then
    if [ $status -gt $mark ]
    then
      mark=$status
    fi
  else
    res=$status
  fi
fi
`;
  }
  return corrector + `
[ $res -eq 0 -a $mark -eq 128 ] && exit 0
[ $res -eq 0 ] && exit $mark
exit $res
`;
}

export function correctorVariables(dynamic) {
  if (dynamic) {
    return `
home=\${1:-}
program=\${2:-}
problem=\${3:-}
input=\${4:-}
expected=\${5:-}
obtained=\${6:-}
error=\${7:-}
args=\${8:-}
context=\${9:-}
classify_code=\${10:-}
`;
  } else {
    return `
home=\${1:-}
program=\${2:-}
problem=\${3:-}
solution=\${4:-}
environment=\${5:-}
`;
  }
  
}

export function indentString(string, count = 1, options = {}) {
	const {
		indent = ' ',
		includeEmptyLines = false
	} = options;
	if (typeof string !== 'string') {
		throw new TypeError(
			`Expected \`input\` to be a \`string\`, got \`${typeof string}\``
		);
	}
	if (typeof count !== 'number') {
		throw new TypeError(
			`Expected \`count\` to be a \`number\`, got \`${typeof count}\``
		);
	}
	if (count < 0) {
		throw new RangeError(
			`Expected \`count\` to be at least 0, got \`${count}\``
		);
	}
	if (typeof indent !== 'string') {
		throw new TypeError(
			`Expected \`options.indent\` to be a \`string\`, got \`${typeof indent}\``
		);
	}
	if (count === 0) {
		return string;
	}
	const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
	return string.replace(regex, indent.repeat(count));
}
