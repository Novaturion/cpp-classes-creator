const VSCode = require('vscode');
const FileSystem = require("fs");
const Path = require("path");

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
		let classInput = yield showClassInput();
		classInput = cleanInput(classInput, false);

		const inputData = parseClassInput(classInput);
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

		let resultPaths = {
			headers: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.defaultHeadersFolder"),
			sources: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.defaultSourcesFolder")
		};

		if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.askFolder")) {
			let pathInput = yield showPathInput();
			pathInput = cleanInput(pathInput, true);

			if (!pathInput) {
				return;
			}

			resultPaths = parsePathInput(pathInput);
		}
		else {
			let projectPaths = getProjectPaths();
			let contextPath = VSCode.workspace.workspaceFolders[0].uri.fsPath.toLowerCase();
		if (parameters && parameters.fsPath) {
			let fsPath = parameters.fsPath.toLowerCase();

			if (!FileSystem.lstatSync(fsPath).isDirectory()) {
				fsPath = Path.dirname(fsPath);
			}

			contextPath = fsPath;
		}

			if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.splitByFolders")) {
			const folders = splitByFolders(
				contextPath,
				resultPaths.sources ? resultPaths.headers : projectPaths.headers,
				resultPaths.headers ? resultPaths.sources : projectPaths.sources
			);

			if (folders) {
				resultPaths.headers = folders.headers;
				resultPaths.sources = folders.sources;
			}
			else {
				resultPaths.headers = contextPath;
				resultPaths.sources = contextPath;
			}
		}
		else {
			resultPaths.headers = contextPath;
			resultPaths.sources = contextPath;
		}
		}

		if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.createFolder")) {
			resultPaths.headers = Path.join(resultPaths.headers, inputData.class);
			resultPaths.sources = Path.join(resultPaths.sources, inputData.class);
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
 * @param {boolean} isPath
 * @returns {string}
 */
function cleanInput(input, isPath) {
	if (!input) {
		return;
	}

	const regex = isPath ? /[^\w\d\s_\-\\/;]+/gi : /[^\w\d\s,_:<>]+/gi;

	input = input.replace(regex, "");
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
function parseClassInput(input) {
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

/**
 * @param {string} path
 * @returns {{
 * headers: string | null;
 * sources: string | null;
 * } | null}
 */
function parsePathInput(path) {
	if (!path) {
		return null;
	}
	path = Path.normalize(path.replace(/ [\\/]/gi, "/").replace(/[\\/] /gi, "/"));
	const paths = path.split(";");
	return {
		headers: paths[0].trim(),
		sources: paths[1] ? paths[1].trim() : paths[0].trim(),
	}
}

/**
 * @returns {{
 * headers: string | null;
 * sources: string | null;
 * } | null}
 */
function getProjectPaths() {
	const path = VSCode.workspace.workspaceFolders[0].uri.fsPath.toLowerCase();
	if (!path) { return null; }

	let projectHeadersPath = null;
	let projectSourcesPath = null;

	if (FileSystem.existsSync(Path.join(path, "include"))) {
		projectHeadersPath = Path.join(path, "include");
	}

	if (!projectHeadersPath && FileSystem.existsSync(Path.join(path, "inc"))) {
		projectHeadersPath = Path.join(path, "inc");
	}

	if (FileSystem.existsSync(Path.join(path, "source"))) {
		projectSourcesPath = Path.join(path, "source");
	}
	if (!projectSourcesPath && FileSystem.existsSync(Path.join(path, "src"))) {
		projectSourcesPath = Path.join(path, "src");
	}
	return { headers: projectHeadersPath, sources: projectSourcesPath };
}

/**
 * @param {string} path
 * @param {string} headers
 * @param {string} sources
 * @returns {{
 * headers: string | null;
 * sources: string | null;
 * } | null}
 */
function splitByFolders(path, headers, sources) {
	if (!path) { return null; }

	const rootPath = VSCode.workspace.workspaceFolders[0].uri.fsPath.toLowerCase();
	headers = headers ? headers.replace(Path.normalize(rootPath + "/"), "") : "";
	sources = sources ? sources.replace(Path.normalize(rootPath + "/"), "") : "";

	if (path.includes(headers)) {
		let difference = path.replace(Path.normalize(headers + "/"), "").replace(Path.normalize(rootPath + "/"), "");
		return { headers: path, sources: Path.join(rootPath, sources, difference) };
	}
	else if (path.includes(sources)) {
		let difference = path.replace(Path.normalize(sources + "/"), "").replace(Path.normalize(rootPath + "/"), "");
		return { headers: Path.join(rootPath, headers, difference), sources: path };
	}

	return { headers: path, sources: path };
}

