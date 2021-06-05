const VSCode = require('vscode');
const FileSystem = require("fs");
const Path = require("path");

const ROOT_FOLDER = Path.normalize(VSCode.workspace.workspaceFolders[0].uri.fsPath.toLowerCase() + Path.sep);

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
var awaiter = (this && this.__awaiter) || function (
	/** @type {any} */
	thisArg,
	/** @type {any} */
	_arguments,
	/** @type {PromiseConstructor} */
	P,
	/** @type {{
	 * [x: string]: (arg0: any) => any;
	 * next: (arg0: any) => any;
	 * apply: (arg0: any, arg1: any) => any;
	 * }} */
	generator) {
	/**
	 * @param {any} value
	 */
	function adopt(value) {
		return value instanceof P ? value : new P(
			function (/** @type {(arg0: any) => void} */ resolve) {
				resolve(value);
			});
	}

	return new (P || (P = Promise))(function (
		/** @type {(arg0: any) => any} */
		resolve,
		/** @type {(arg0: any) => void} */
		reject
	) {
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
		const inputData = handleClassInput(classInput);

		if (!inputData) { return; }

		let contextPath = null;
		if (parameters && parameters.fsPath) {
			let fsPath = parameters.fsPath.toLowerCase();

			if (!FileSystem.lstatSync(fsPath).isDirectory()) {
				fsPath = Path.dirname(fsPath);
			}

			contextPath = fsPath;
		}

		let resultPaths = { header: null, source: null };
		if (!contextPath) {
			let pathInput = yield showPathInput();
			pathInput = cleanInput(pathInput, true);

			if (!pathInput) {
				return;
			}

			resultPaths = parsePathInput(pathInput);
		}
		else {
			resultPaths = processPaths(contextPath);
		}

		if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.createFolder")) {
			resultPaths.header = Path.join(resultPaths.header, inputData.class);
			resultPaths.source = Path.join(resultPaths.source, inputData.class);
		}

		resultPaths.header = Path.join(
			resultPaths.header,
			inputData.class +
			(VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.file.useCppHeader")
				? ".hpp" : ".h")
		);
		resultPaths.source = Path.join(
			resultPaths.source,
			inputData.class +
			(VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.file.useCxxSource")
				? ".cxx" : ".cpp")
		);

		if (makeFolders(Path.dirname(resultPaths.header), Path.dirname(resultPaths.source))) {
			writeFiles(
				{
					headerPath: resultPaths.header,
					sourcePath: resultPaths.source,
					headerContent: getHeader(inputData),
					sourceContent: getSource(resultPaths.header)
				}
			);
		}
	});
}

/**
 * @returns {string | null}
*/
function showClassInput() {
	return awaiter(this, void 0, void 0, function* () {
		return VSCode.window.showInputBox(
			{
			ignoreFocusOut: false,
			placeHolder: "class Namespace::Class<T, U> : Parent, Interface",
			prompt: "Provide what you want to create. Must contains \"class\" or \"struct\" keyword at the begining. Can be with namespace, template and parent class."
			}
		);
	});
}

/**
 * @returns {string | null}
*/
function showPathInput() {
	return awaiter(this, void 0, void 0, function* () {
		return yield VSCode.window.showInputBox(
			{
			ignoreFocusOut: false,
			placeHolder: "path/to/header; path/to/source",
			prompt: "Provide in which folders files will be created. Must be relative to the root folder."
			}
		);
	});
}

/**
 * @param {string} path
 * @returns {string | null}
 */
function showRewriteFileInput(path) {
	return awaiter(this, void 0, void 0, function* () {
		return yield VSCode.window.showQuickPick(
			["Yes", "No"],
			{
				placeHolder: path + " already exists, rewrite?",
				canPickMany: false
			}
		);
	});
}

/**
 * @param {string} input
 * @returns {{
 * namespace: string | null;
 * template: string | null;
 * parent: string | null;
 * class: string | null;
 * type: string | null;
 * } | null}
 */
function handleClassInput(input) {
	const inputData = parseClassInput(cleanInput(input, false));

	if (typeof (inputData) == "string") {
		VSCode.window.showErrorMessage(
			"Wrong type provided - \"" + inputData + "\". Must be \"class\" or \"struct\"."
		);
		return null;
	}
	else if (inputData && !inputData.class) {
		VSCode.window.showErrorMessage(
			"Input doesn't contains definition of the \"class\" or \"struct\"."
		);
		return null;
	}
	else if (!inputData) {
		return null;
	}

	return inputData;
}

/**
 * @param {string} contextPath
 * @returns {{
 * header: string | null;
 * source: string | null;
 * } | null}
 */
function getPaths(contextPath) {
	let resultPaths = {
		header: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.defaultHeadersFolder"),
		source: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.defaultSourcesFolder")
	}

	let projectPaths = {
		header: null,
		source: null
	};

	if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.detectFolders")) {
		projectPaths = getProjectPaths();
	}

	if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.splitByFolders")) {
		const folders = splitByFolders(
			contextPath,
			resultPaths.source ? resultPaths.header : projectPaths.header,
			resultPaths.header ? resultPaths.source : projectPaths.source
		);

		if (folders) {
			resultPaths.header = folders.header;
			resultPaths.source = folders.source;
		}
		else {
			resultPaths.header = contextPath;
			resultPaths.source = contextPath;
		}
	}
	else {
		resultPaths.header = contextPath;
		resultPaths.source = contextPath;
	}

	return resultPaths;
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

	const regex = isPath ? /[^\w\d\s_\-\\/;]+/g : /[^\w\d\s,_:<>]+/g;

	input = input
		.replace(regex, "")
		.replace(/[\s\t]+/g, " ")
		.trim();

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

	let type = input.match(/^[a-z]+/)[0];

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

	let namespace = null;
	const namespaceRegex = input.match(/([\w\d\s_]+)::/);
	if (namespaceRegex) {
		namespace = namespaceRegex[1].trim();
		input = input.replace(namespaceRegex[0], "");
	}

	let template = null;
	const templateRegex = input.match(/<([\w\d\s_,]+)>/);
	if (templateRegex) {
		template = templateRegex[1].trim();
		input = input.replace(templateRegex[0], "");
	}

	let parent = null;
	const parentRegex = input.match(/:([\w\d\s_,]+)$/);
	if (parentRegex) {
		parent = parentRegex[1].trim();
		input = input.replace(parentRegex[0], "");
	}

	let class_ = null;
	const classRegex = input.match(/([\w\d\s_]+)/);
	if (classRegex) {
		class_ = classRegex[1].trim();
	}

	if ([namespaceRegex, templateRegex, parentRegex, classRegex].every((value) => !value)) {
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
 * @param {string} data
 * @returns {{
 * header: string | null;
 * source: string | null;
 * } | null}
 */
function parsePathInput(data) {
	if (!data) {
		return null;
	}
	data = Path.normalize(data.replace(/[\s]?[\\/][\s]?/g, "/"));

	const inputPaths = data.split(";");
	let paths = {
		header: inputPaths[0].trim(),
		source: (inputPaths[1] ? inputPaths[1].trim() : inputPaths[0].trim()),
	}

	if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.detectFolders")) {
		let projectPaths = getProjectPaths();
		paths.header = Path.join(projectPaths.header, paths.header);
		paths.source = Path.join(projectPaths.source, paths.source);
	}

	return paths;
}

/**
 * @returns {{
 * header: string | null;
 * source: string | null;
 * } | null}
 */
function getProjectPaths() {
	let projectHeadersPath = null;
	let projectSourcesPath = null;

	for (const folder of VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.detectHeadersFolder")) {
		if (FileSystem.existsSync(Path.join(ROOT_FOLDER, folder))) {
			projectHeadersPath = Path.join(ROOT_FOLDER, folder);
			break;
	}
	}

	for (const folder of VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.detectSourcesFolder")) {
		if (FileSystem.existsSync(Path.join(ROOT_FOLDER, folder))) {
			projectSourcesPath = Path.join(ROOT_FOLDER, folder);
			break;
	}
	}

	return { header: projectHeadersPath, source: projectSourcesPath };
}

/**
 * @param {string} rootPath
 * @param {string} headerPath
 * @param {string} sourcePath
 * @returns {{
 * header: string | null;
 * source: string | null;
 * } | null}
 */
function splitByFolders(rootPath, headerPath, sourcePath) {
	if (!rootPath) { return null; }

	headerPath = headerPath ? headerPath : ROOT_FOLDER;
	sourcePath = sourcePath ? sourcePath : ROOT_FOLDER;

	if (rootPath.includes(headerPath)) {
		let difference = rootPath.replace(headerPath, "").replace(ROOT_FOLDER, "");
		return { header: rootPath, source: Path.join(sourcePath, difference) };
	}
	else if (rootPath.includes(sourcePath)) {
		let difference = rootPath.replace(sourcePath, "").replace(ROOT_FOLDER, "");
		return { header: Path.join(headerPath, difference), source: rootPath };
	}

	return { header: headerPath, source: sourcePath };
}

/**
 * @param {{
 * namespace: string | null;
 * template: string | null;
 * parent: string | null;
 * class: string | null;
 * type: string | null;
 * } | null} data
 * @returns {string}
 */
function getHeader(data) {
	if (!data || data && (!data.type || !data.class)) {
		return "";
	}

	let lines = [data.type + " " + data.class];
	if (data.template) {
		lines.splice(0, 0, "template <class " + data.template.replace(/[\s]?,[\s]?/g, ", class ") + ">");
	}

	if (data.parent) {
		lines[lines.length > 1 ? 1 : 0] += " : public " + data.parent.replace(/[\s]?,[\s]?/g, ", public ");
	}

	lines = lines.concat([
		"{",
		"\tpublic:",
		"\t\t" + data.class + "() = default;\n",
		"\t\t~" + data.class + "() = default;",
		"};"
	]);

	if (data.namespace) {
		for (let i = 0; i < lines.length; i++) {
			lines[i] = "\t" + lines[i];
		}
		lines.splice(0, 0, "namespace " + data.namespace + "\n{");
		lines.push("}")
	}

	if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.header.useDefine")) {
		let classUpper = data.class.toUpperCase();
		lines.splice(0, 0, "#ifndef " + classUpper + "_H");
		lines.splice(1, 0, "#define " + classUpper + "_H\n\n");
		lines.push("#endif");
	}

	if (VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.header.usePragma")) {
		if (lines.indexOf("#endif") > -1) {
			lines.splice(2, 0, "#pragma once\n\n")
			lines[1] = lines[1].replace("\n\n", "")
		}
		else {
			lines.splice(0, 0, "#pragma once\n\n");
		}
	}

	let header = lines.join("\n");

	return header;
}

/**
 * @param {string | null} headerPath
 * @returns {string}
 */
function getSource(headerPath) {
	if (!headerPath) {
		return "";
	}

	headerPath = headerPath
		.replace(ROOT_FOLDER, "")
		.replace(/[\\]/g, "/")
		.replace(/[\w\d\s\t_\-]+\//, "")

	return "#include \"" + headerPath + "\"\n";
}

/**
 * @param {string[] | null} paths
 * @returns {boolean}
 */
function makeFolders(...paths) {
	if (!paths || paths &&
		(paths.length < 1 || paths.every((path) => !path))
	) {
		return false;
	}

	for (let path of paths) {
		if (!path) {
			continue;
		}

		if (!FileSystem.existsSync(path)) {
			FileSystem.mkdirSync(path, { recursive: true });
		}
	}
	return true;
}

/**
 * @param {{
 * headerPath: string | null;
 * sourcePath: string | null;
 * headerContent: string | null;
 * sourceContent: string | null;
 * }[] | null[] | null} files
 * @returns {boolean}
 */
function writeFiles(...files) {
	return awaiter(this, void 0, void 0, function* () {
	if (!files || files &&
		(files.length < 1 || files.every((data) => !data))
	) {
		return false;
	}

	for (const data of files) {
			if (!data || data && !data.headerPath) {
			continue;
		}

			let result;
			if (FileSystem.existsSync(data.headerPath)) {
				result = yield showRewriteFileInput(data.headerPath);
			}
			else if (FileSystem.existsSync(data.sourcePath)) {
				result = yield showRewriteFileInput(data.headerPath);
			}

			if (!result || result && result.toLowerCase() == "yes") {
				FileSystem.writeFile(
					data.headerPath,
					data.headerContent ? data.headerContent : "",
					function (error) {
						if (error) {
							VSCode.window.showErrorMessage(error.message);
							return false;
						}
					}
				);

		FileSystem.writeFile(
					data.sourcePath,
					data.sourceContent ? data.sourceContent : "",
			function (error) {
				if (error) {
					VSCode.window.showErrorMessage(error.message);
					return false;
				}
			}
		);
	}
		}
	return true;
	});
}
