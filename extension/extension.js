const VSCode = require('vscode');

/**
 * @param {VSCode.ExtensionContext} context
 */
function activate(context) {
	return awaiter(this, void 0, void 0, function* () {
		let disposable = VSCode.commands.registerCommand('cpp-classes-creator.createCppClass', main);
		context.subscriptions.push(disposable);
	});
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}

// @ts-ignore
var awaiter = (this && this.__awaiter) || function (/** @type {any} */ thisArg, /** @type {any} */ _arguments, /** @type {PromiseConstructor} */ P, /** @type {{ [x: string]: (arg0: any) => any; next: (arg0: any) => any; apply: (arg0: any, arg1: any) => any; }} */ generator) {
	/**
	 * @param {any} value
	 */
	function adopt(value) {
		return value instanceof P ? value : new P(
			function (/** @type {(arg0: any) => void} */ resolve) {
				resolve(value);
			});
	}

	return new (P || (P = Promise))(function (/** @type {(arg0: any) => any} */ resolve, /** @type {(arg0: any) => void} */ reject) {
		/**
		 * @param {any} value
		 */
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (exception) {
				reject(exception);
			}
		}

		/**
		 * @param {any} value
		 */
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (exception) {
				reject(exception);
			}
		}

		/**
		 * @param {{ done: any; value: any; }} result
		 */
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}

		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};

/**
 * @param {{ fsPath: string; }} parameters
 * @returns {void}
 */
function main(parameters) {
	awaiter(this, void 0, void 0, function* () {
		let input = yield showClassInput();
		input = cleanInput(input);

		let inputData = parseInput(input);
		if (typeof (inputData) == "string") {
			VSCode.window.showErrorMessage(
				"Wrong type provided - \"" + inputData + "\". Must be \"class\" or \"struct\"."
			);
			return;
		}
		else if (inputData && !inputData.class) {
			VSCode.window.showErrorMessage(
				"Input doesn't contains definition of the \"class\" or \"struct\"."
			);
			return;
		}
		else if (!inputData) {
			return;
		}
	});
}

/**
 * @returns {void}
*/
function showClassInput() {
	return awaiter(this, void 0, void 0, function* () {
		var option = {
			ignoreFocusOut: false,
			placeHolder: "class Namespace::Class<T, U> : Parent, Interface",
			prompt: "Provide what you want to create. Must contains \"class\" or \"struct\" keyword at the begining. Can be with namespace, template and parent class."
		};
		return VSCode.window.showInputBox(option);
	});
}

/**
 * @returns {void}
*/
function showPathInput() {
	return awaiter(this, void 0, void 0, function* () {
		var option = {
			ignoreFocusOut: false,
			placeHolder: "path/to/header; path/to/source",
			prompt: "Provide in which folders files will be created. Should be relative to the root folder."
		};
		return yield VSCode.window.showInputBox(option);
	});
}

/**
 * @param {string} input
 * @returns {string}
 */
function cleanInput(input) {
	if (!input) { return; }

	input = input.replace(/[^\w\d\s,_:<>]+/gi, "");
	input = input.replace(/[\s\t]+/gi, " ").trim();
	return input;
}

/**
 * @param {string} input
 * @returns {{
 * namespace: string | null;
 * template: string | null;
 * parent: string | null;
 * class: string | null;
 * type: string | null;
 * } | string | null}
 */
function parseInput(input) {
	if (!input) { return null; }

	let type = (input + " ").slice(0, input.indexOf(" "));
	if (!(type == "class" || type == "struct")) {
		return type;
	}
	else if (input.split(" ").length < 2) {
		return {
			namespace: null,
			template: null,
			parent: null,
			class: null,
			type: type
		};
	}

	input = input.replace(type, "").trim();

	const namespaceRegex = input.match(/([\w\d\s_]+)::/);
	const templateRegex = input.match(/<([\w\d\s_,]+)>/);
	const parentRegex = input.match(/:([\w\d\s_,]+)$/);
	const classRegex = input.match(/::([\w\d\s_,<>]+):/);

	let namespace = null;
	let template = null;
	let parent = null;
	let class_ = null;

	if (namespaceRegex) {
		namespace = namespaceRegex[1];
	}
	if (templateRegex) {
		template = templateRegex[1];
	}
	if (parentRegex) {
		parent = parentRegex[1];
	}
	if (classRegex) {
		if (template) {
			class_ = classRegex[1].replace("<" + template + ">", "");
		}
		else {
			class_ = classRegex[1];
		}
	}

	if ([namespaceRegex, templateRegex, parentRegex, classRegex].every((value) => value == null)) {
		class_ = input;
	}

	return {
		namespace: namespace,
		template: template,
		parent: parent,
		class: class_,
		type: type
	};
}
