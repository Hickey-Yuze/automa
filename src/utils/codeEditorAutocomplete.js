/* eslint-disable no-template-curly-in-string */
import { snippet } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { jsApiDocs, renderApiDoc } from './jsApiDocs';

function docInfo(name) {
  const doc = jsApiDocs.find((item) => item.name === name);

  return () => renderApiDoc(doc);
}

const completePropertyAfter = ['PropertyName', '.', '?.'];
const excludeProps = ['chrome', 'Mousetrap'];

function completeProperties(from, object) {
  const options = [];
  /* eslint-disable-next-line */
  for (const name in object) {
    if (
      !name.startsWith('__') &&
      !name.startsWith('webpack') &&
      !excludeProps.includes(name)
    )
      options.push({
        label: name,
        type: typeof object[name] === 'function' ? 'function' : 'variable',
      });
  }
  return {
    from,
    options,
    validFor: /^[\w$]*$/,
  };
}

export const dontCompleteIn = [
  'String',
  'TemplateString',
  'LineComment',
  'BlockComment',
  'VariableDefinition',
  'PropertyDefinition',
];
export function completeFromGlobalScope(context) {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (
    completePropertyAfter.includes(nodeBefore.name) &&
    nodeBefore.parent?.name === 'MemberExpression'
  ) {
    const object = nodeBefore.parent.getChild('Expression');
    if (object?.name === 'VariableName') {
      const from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from;
      const variableName = context.state.sliceDoc(object.from, object.to);
      if (typeof window[variableName] === 'object')
        return completeProperties(from, window[variableName]);
    }
  } else if (nodeBefore.name === 'VariableName') {
    return completeProperties(nodeBefore.from, window);
  } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
    return completeProperties(context.pos, window);
  }
  return null;
}

export function automaFuncsCompletion(snippets) {
  return function (context) {
    const word = context.matchBefore(/\w*/);
    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

    if (
      (word.from === word.to && !context.explicit) ||
      dontCompleteIn.includes(nodeBefore.name)
    )
      return null;

    return {
      from: word.from,
      options: snippets,
    };
  };
}

export const automaFuncsSnippets = {
  automaNextBlock: {
    label: 'automaNextBlock',
    type: 'function',
    apply: snippet('automaNextBlock(${data})'),
    info: docInfo('automaNextBlock'),
  },
  automaSetVariable: {
    label: 'automaSetVariable',
    type: 'function',
    apply: snippet("automaSetVariable('${name}', ${value})"),
    info: docInfo('automaSetVariable'),
  },
  automaFetch: {
    label: 'automaFetch',
    type: 'function',
    apply: snippet("automaFetch('${json}', { url: '${}' })"),
    info: docInfo('automaFetch'),
  },
  automaRefData: {
    label: 'automaRefData',
    type: 'function',
    apply: snippet("automaRefData('${keyword}', '${path}')"),
    info: docInfo('automaRefData'),
  },
  automaResetTimeout: {
    label: 'automaResetTimeout',
    type: 'function',
    apply: snippet('automaResetTimeout()'),
    info: docInfo('automaResetTimeout'),
  },
  automaExecWorkflow: {
    label: 'automaExecWorkflow',
    type: 'function',
    apply: snippet("automaExecWorkflow({ id: '${workflowId}' })"),
    info: docInfo('automaExecWorkflow'),
  },
};
