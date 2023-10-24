/*
 * MIT License
 * 
 * Copyright (c) 2023 Ilya "Novaturion" Podtelezhnikov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const VSCode = require('vscode');
const FileSystem = require("fs");
const Path = require("path");

const ROOT_FOLDER = Path.normalize(VSCode.workspace.workspaceFolders[0].uri.fsPath);
const SETTINGS = {
	folderNameCase: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.nameCase"),
	defaultHeaderFolders: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.defaultHeaderFolders"),
	defaultSourceFolders: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.defaultSourceFolders"),
	createClassFolder: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.createClassFolder"),
	createNamespaceFolder: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.createNamespaceFolder"),
	splitByFolders: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.splitByFolders"),
	caseSensetiveDetection: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.folder.caseSensetiveDetection"),
	fileNameCase: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.file.nameCase"),
	useCppHeader: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.file.useCppHeader"),
	useCxxSource: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.file.useCxxSource"),
	usePragma: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.header.usePragma"),
	useDefine: VSCode.workspace.getConfiguration().get("C_Cpp.classesCreator.header.useDefine")
}

/**
 * @param {VSCode.ExtensionContext} context
 */
function activate(context) {
	return awaiter(this, void 0, void 0, function* () {
		let commandContextMenu = VSCode.commands.registerCommand("cpp-classes-creator.createClassContextMenu", main);
		let commandPopupMenu = VSCode.commands.registerCommand("cpp-classes-creator.createClassPopupMenu", main);

		context.subscriptions.push(commandContextMenu);
		context.subscriptions.push(commandPopupMenu);
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
		const classInputData = parseClassInput(clearInput(classInput, false));

		if (!classInputData) {
			return;
		}

		let paths = { header: "", source: "" };
		if (parameters && parameters.fsPath) {
			paths.header = parameters.fsPath.replace(ROOT_FOLDER, "");
			if (paths.header) {
				paths.header = paths.header.slice(1);
			}
			paths.source = paths.header;
		}
		else {
			let pathsInput = yield showPathInput();
			paths = parsePathInput(clearInput(pathsInput, true));

			if (!paths) {
				return;
			}
		}

		const projectPaths = getProjectPaths();
		const projectNames = Object.keys(projectPaths);

		let project = "";
		if (projectNames.length > 1) {
			const projects = projectNames.filter((element) => {
				return paths.header.split(Path.sep)[0] === element
					|| paths.source.split(Path.sep)[0] === element;
			});

			if (projects.length) {
				project = projects[0];
				paths.header = paths.header.replace(project + Path.sep, "");
				paths.source = paths.source.replace(project + Path.sep, "");
			}
			else {
				let projectInput = yield showProjectInput(projectNames);
				project = clearInput(projectInput, true);

				if (!project) {
					return;
				}
			}
		}
		else {
			project = projectNames[0];
		}

		if (SETTINGS.splitByFolders) {
			paths = splitByFolders(projectPaths[project], paths)
		}

		paths = addFolders(paths, classInputData.namespace, classInputData.class);
		paths = addFiles(paths, classInputData.class);

		paths.header = Path.normalize(Path.join(ROOT_FOLDER, project, paths.header));
		paths.source = Path.normalize(Path.join(ROOT_FOLDER, project, paths.source));

		if (paths.header && paths.source
			&& makeFolder(Path.dirname(paths.header))
			&& makeFolder(Path.dirname(paths.source))) {
			yield writeFile(paths.header, getHeader(classInputData));
			yield writeFile(paths.source, getSource(paths.header));
		}
		else {
			VSCode.window.showErrorMessage(
				"Couldn't create files.\nHeader: \"" + paths.header + "\"\nSource: \"" + paths.source + "\""
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
				prompt: "Provide in which folders files will be created. Must be relative to the root or include/source folders. Type dot to use the workspace root folder."
			}
		);
	});
}

/**
 * @param {string[]} projects
 * @returns {string | null}
*/
function showProjectInput(projects) {
	return awaiter(this, void 0, void 0, function* () {
		return yield VSCode.window.showQuickPick(
			projects,
			{
				placeHolder: "Project (folder) where to create files:",
				canPickMany: false
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
 * @param {boolean} isPath
 * @returns {string}
 */
function clearInput(input, isPath) {
	if (!input) {
		return;
	}

	const regex = isPath ? /[^\w\d\s_\-\\/\.;]+/g : /[^\w\d\s,_:<>]+/g;

	return input
		.replace(regex, "")
		.replace(/[\s\t]+/g, " ")
		.trim();
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
function parseClassInput(input) {
	if (!input) { return null; }

	let type = input.match(/^[a-z]+/)[0];

	if (!(type == "class" || type == "struct")) {
		VSCode.window.showErrorMessage(
			"Wrong type provided - \"" + type + "\". Must be \"class\" or \"struct\"."
		);
		return null;
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
	const namespaceRegex = input.match(/([\w\d\s_]+)::/g);
	if (namespaceRegex) {
		namespace = namespaceRegex.join("");
		input = input.replace(namespace, "");
		namespace = namespace.replace(/\s/g, "");
		namespace = namespace.substring(0, namespace.length - 2);
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

	if ([namespaceRegex, templateRegex, parentRegex, classRegex].every((value) => { return !value })) {
		class_ = input;
	}

	if (!class_) {
		VSCode.window.showErrorMessage(
			"Input doesn't contains definition of the \"class\" or \"struct\"."
		);
		return null;
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
 * }}
 */
function parsePathInput(data) {
	if (!data) {
		return null;
	}

	if (data.trim().toLowerCase() == ".") {
		return {
			header: "",
			source: ""
		};
	}

	const input = Path.normalize(data).split(";");

	return {
		header: input[0].trim(),
		source: (input[1] ? input[1].trim() : input[0].trim()),
	};
}

/**
 * @param {string} rootPath
 */
function getFolderPaths(rootPath) {
	return FileSystem.readdirSync(rootPath)
		.filter((name) => {
			return FileSystem.lstatSync(Path.join(rootPath, name)).isDirectory();
		});
}

/**
 * @param {string[]} folders
 * @returns {{
 * header: string | null;
 * source: string | null;
 * }}
*/
function getSourcePaths(folders) {
	let paths = {
		header: "",
		source: ""
	}

	const headerFolders = folders.filter((folder) => {
		return SETTINGS.defaultHeaderFolders.find(
			(element) => {
				return SETTINGS.caseSensetiveDetection
					? element === folder
					: element.toLowerCase() === folder.toLowerCase()
			}
		);
	});

	const sourceFolders = folders.filter((folder) => {
		return SETTINGS.defaultSourceFolders.find(
			(element) => {
				return SETTINGS.caseSensetiveDetection
					? element === folder
					: element.toLowerCase() === folder.toLowerCase()
			}
		);
	});

	if (headerFolders.length) {
		paths.header = headerFolders[0];
	}

	if (sourceFolders.length) {
		paths.source = sourceFolders[0];
	}

	return paths;
}

// /**
//  * @returns {{
//  * {
//  * header: string | null;
//  * source: string | null;
//  * }
//  * }}
//  */
function getProjectPaths() {
	let workspacePaths = getFolderPaths(ROOT_FOLDER);
	let sourcePaths = getSourcePaths(workspacePaths);

	let projectPaths = {};
	if (sourcePaths.header || sourcePaths.source) {
		projectPaths["workspace"] = sourcePaths;
	}

	for (const folder of workspacePaths) {
		sourcePaths = getSourcePaths(getFolderPaths(Path.join(ROOT_FOLDER, folder)));
		if (sourcePaths.header || sourcePaths.source) {
			projectPaths[folder] = sourcePaths;
		}
	}

	return projectPaths;
}

/**
 * @param {{
 * header: string | null;
 * source: string | null;
 * }} sourcePaths
 * @param {{
 * header: string | null;
 * source: string | null;
 * }} sourcePaths
 * @returns {{
 * header: string | null;
 * source: string | null;
 * }}
 */
function splitByFolders(sourcePaths, paths) {
	if (!(sourcePaths.header && sourcePaths.source)) {
		return paths;
	}

	if (paths.header.includes(sourcePaths.header)) {
		paths.source = paths.header.replace(sourcePaths.header, sourcePaths.source);
	}
	else if (paths.source.includes(sourcePaths.source)) {
		paths.header = paths.source.replace(sourcePaths.source, sourcePaths.header);
	}

	if (!paths.header) {
		paths.header = sourcePaths.header;
	}
	if (!paths.source) {
		paths.source = sourcePaths.source;
	}

	return paths;
}

/**
 * @param {string | null} path
 * @returns {string | null}
 */
function applyCase(path) {
	if (!path) {
		return path;
	}

	const isFolder = !Path.extname(path);
	const caseName = isFolder ? SETTINGS.folderNameCase.toLowerCase() : SETTINGS.fileNameCase.toLowerCase();

	if (caseName === "none") {
		return path;
	}

	const lowerLowerRegex = "([a-z\d][_][a-z\d])";
	const lowerUpperRegex = "([a-z\d][A-Z])";
	const kebabRegex = lowerLowerRegex + "|" + lowerUpperRegex

	const capitalize = (string) => {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	const decapitalize = (string) => {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	let regex = null;
	let getReplacement = null;
	let getTransformedCase = null;

	if (caseName === "snake_case") {
		regex = lowerUpperRegex;
		getReplacement = (group) => {
			return group.slice(0, 1) + "_" + group.slice(1);
		};
		getTransformedCase = (group) => {
			return group.toLowerCase();
		};
	}
	else if (caseName === "kebab-case") {
		regex = kebabRegex;
		getReplacement = (group) => {
			return group.slice(0, 1) + "-" + group.slice(1).replace("_", "");
		};
		getTransformedCase = (group) => {
			return group.toLowerCase();
		};
	}
	else if (caseName === "camelCase") {
		regex = lowerLowerRegex;
		getReplacement = (group) => {
			return group.slice(0, 1) + group.slice(2).toUpperCase();
		};
		getTransformedCase = (group) => {
			return decapitalize(group);
		};
	}
	else if (caseName === "UpperCamelCase") {
		regex = lowerLowerRegex;
		getReplacement = (group) => {
			return group.slice(0, 1) + group.slice(2).toUpperCase();
		};
		getTransformedCase = (group) => {
			return capitalize(group);
		};
	}

	const match = path.match(RegExp(regex, "g"));
	if (match) {
		for (let i = 0; i < match.length; i++) {
			const group = match[i];
			path = path.replace(group, getReplacement(group));
		}
	}

	return getTransformedCase(path);
}

/**
 * @param {{
 * header: string | null;
 * source: string | null;
 * }} paths
 * @param {string | null} namespace
 * @param {string | null} class_
 * @returns {{
 * header: string | null;
 * source: string | null;
 * }}
 */
function addFolders(paths, namespace, class_) {
	if (!class_ || !paths || paths && (paths.header === null || paths.source === null)) {
		return paths;
	}

	if (namespace && SETTINGS.createNamespaceFolder) {
		const namespaceFolders = namespace.split("::");

		for (const folder of namespaceFolders) {
			if (!paths.header.toLowerCase().includes(Path.sep + folder.toLowerCase())) {
				paths.header = Path.join(paths.header, applyCase(folder));
			}

			if (!paths.source.toLowerCase().includes(Path.sep + folder.toLowerCase())) {
				paths.source = Path.join(paths.source, applyCase(folder));
			}
		}
	}

	if (SETTINGS.createClassFolder) {
		paths.header = Path.join(paths.header, class_);
		paths.source = Path.join(paths.source, class_);
	}

	return paths;
}

/**
 * @param {{
 * header: string | null;
 * source: string | null;
 * }} paths
 * @param {string} fileName
 * @returns {{
 * header: string | null;
 * source: string | null;
 * } | null}
 */
function addFiles(paths, fileName) {
	if (!paths || paths && (paths.header === null || paths.source === null)) {
		return paths;
	}

	paths.header = Path.join(
		paths.header,
		applyCase(
			fileName + (SETTINGS.useCppHeader ? ".hpp" : ".h")
		)
	);
	paths.source = Path.join(
		paths.source,
		applyCase(
			fileName + (SETTINGS.useCxxSource ? ".cxx" : ".cpp")
		)
	);

	return paths;
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
		"public:",
		"\t" + data.class + "() = default;\n",
		"\t~" + data.class + "() = default;",
		"};"
	]);

	if (data.namespace) {
		for (let i = 0; i < lines.length; i++) {
			lines[i] = "\t" + lines[i];
		}
		lines.splice(0, 0, "namespace " + data.namespace + "\n{");
		lines.push("}")
	}

	if (SETTINGS.useDefine) {
		let classUpper = data.class.toUpperCase();
		lines.splice(0, 0, "#ifndef " + classUpper + "_H");
		lines.splice(1, 0, "#define " + classUpper + "_H\n\n");
		lines.push("#endif");
	}

	if (SETTINGS.usePragma) {
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
		.replace(/[\w\d\s\t_\-]+\//, "");

	if (headerPath.startsWith("/")) {
		headerPath = headerPath.slice(1);
	}

	return "#include \"" + headerPath + "\"\n";
}

/**
 * @param {string | null} path
 * @returns {boolean}
 */
function makeFolder(path) {
	if (!path) {
		return false;
	}

	if (!FileSystem.existsSync(path)) {
		FileSystem.mkdirSync(path, { recursive: true });
	}

	return true;
}

/**
 * @param {string | null} path
 * @param {string | null} content
 * @returns {boolean}
 */
function writeFile(path, content) {
	return awaiter(this, void 0, void 0, function* () {
		if (!path) {
			return false;
		}

		let isRewriteAllowed = null;
		if (FileSystem.existsSync(path)) {
			isRewriteAllowed = yield showRewriteFileInput(path);
		}

		if (isRewriteAllowed && isRewriteAllowed.toLowerCase() != "yes") {
			return true;
		}

		let isErrorOccured = false;
		FileSystem.writeFileSync(
			path,
			content ? content : ""
		);

		return isErrorOccured;
	});
}
