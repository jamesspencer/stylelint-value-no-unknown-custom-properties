import stylelint from 'stylelint';
import valueParser from 'postcss-value-parser';
import ruleName from './rule-name.mjs';
import messages from './messages.mjs';

// validate css declarations
export default (decl, { result, customProperties }) => {
	const valueAST = valueParser(decl.value);

	validateValueAST(valueAST, { result, customProperties, decl });
};

// validate a value ast
const validateValueAST = (ast, { result, customProperties, decl }) => {
	const isValid = typeof ast?.walk === 'function';

	if (!isValid) {
		return;
	}

	ast.walk(node => {
		if (isVarFunction(node)) {
			const [propertyNode, , ...fallbacks] = node.nodes;
			const propertyName = propertyNode.value;

			if (!(propertyName in customProperties)) {
				stylelint.utils.report({
					message: messages.unexpected(propertyName, decl.prop),
					node: decl,
					result,
					ruleName,
					word: String(propertyName),
				});
			}

			const varFallbacks = fallbacks.filter(isVarFunction);
			// conditionally test fallbacks
			if (varFallbacks.length) {
				validateValueAST({ nodes:  varFallbacks}, { result, customProperties, decl });
			}

			return;
		}
	});
};

// whether the node is a var() function
const isVarFunction = node => node.type === 'function' && node.value === 'var' && node.nodes[0].value.startsWith('--');
