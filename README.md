# C++ Classes Creator

This simple extension allows you to create classes or structures in a better way.

## Features
- Hotkeys
	- `Shift` + `Alt` + `C` to create new class while text editor is focused
- Parse namespace, class/structure name, template and parent class/structure.<br>
	So this input
	```C++
	class Containers::MyContainer<T, U> : Container, IDisposable
	```
	will be expanded to
	```C++
	#pragma once

	namespace Containers
	{
		template <class T, class U>
		class MyContainer : public Container, public IDisposable
		{
			public:
				MyContainer() = default;

				~MyContainer() = default;
		};
	}
	```
- Automatic detection of *`include`* and *`source`* folders by its names.
- Create files in different folders, like *`include`* and *`source`*.
- Create files in existing namespace folders.
- Create folder that matches namespace.
- Create folder that matches class.
- Writing `#pragma once` or/and `#ifndef` guarders

**Creation with default settings**

![Creation](https://github.com/Novaturion/cpp-classes-creator/blob/main/assets/readme/creation_default.gif?raw=true)

**Creation under existing namespace folder**

![Creation](https://github.com/Novaturion/cpp-classes-creator/blob/main/assets/readme/creation_namespace.gif?raw=true)

**Creation with hotkey**

![Creation with hotkey](https://github.com/Novaturion/cpp-classes-creator/blob/main/assets/readme/creation_ask.gif?raw=true)

## Extension Settings

This extension contributes the following settings:

| Name													| Type			| Default			| Description	|
| ---													| ---			| ---				| ---			|
| `C_Cpp.classesCreator.folder.nameCase`				| **enum**		| *kebab-case*		| Which case will be applied to folders.	|
| `C_Cpp.classesCreator.folder.defaultHeaderFolders`	| **string[]**	| *inc, include*	| List of *header* folder names to check in the root folder.	|
| `C_Cpp.classesCreator.folder.defaultSourceFolders`	| **string[]**	| *src, source*		| List of *source* folder names to check in the root folder.	|
| `C_Cpp.classesCreator.folder.detectFolders`			| **boolean**	| *true*			| Enable detection of *header* and *source* folders based on `defaultHeaderFolders` and `defaultSourceFolders` lists.	|
| `C_Cpp.classesCreator.folder.caseSensetiveDetection`	| **boolean**	| *true*			| Make detection of header and source folders case-sensetive.	|
| `C_Cpp.classesCreator.folder.splitByFolders`			| **boolean**	| *true*			| Create header file in detected *header* folder and source file in detected *source* folder. If doesn't exist, the root folder will be used.	|
| `C_Cpp.classesCreator.folder.createClassFolder`		| **boolean**	| *false*			| Create folder for the class. If `splitByFolders` is *true*, same folders will be created in *header* and *source* folders.	|
| `C_Cpp.classesCreator.folder.createNamespaceFolder`	| **boolean**	| *true*			| Create folder for the namespace. If `splitByFolders` is *true*, same folders will be created in *header* and *source* folders.	|
|														|				|					|	|
| `C_Cpp.classesCreator.file.nameCase`					| **enum**		| *kebab-case*		| Which case will be applied to files.	|
| `C_Cpp.classesCreator.file.useCppHeader`				| **boolean**	| *true*			| Use *.hpp* instead of *.h*.	|
| `C_Cpp.classesCreator.file.useCxxSource`				| **boolean**	| *false*			| Use *.cxx* instead of *.cpp*.	|
|														|				|					|	|
| `C_Cpp.classesCreator.header.usePragma`				| **boolean**	| *true*			| Use `#pragma once`.	|
| `C_Cpp.classesCreator.header.useDefine`				| **boolean**	| *false*			| Use `#ifndef`.	|

<br>

## Known Issues

Add an [issue](https://github.com/Novaturion/cpp-classes-creator/issues)

## Release Notes

- ### 0.1.2
	- Fixed paths always being converted to lower case
	- Added support of multi-project solutions (detecting projects by *header* and *source* folders)
	- Added support of nested namespaces (`Namespace1::Namespace2[::Namespace#]::Class`)
	- Added option to make searching of header/source folders case-sensetive
	- Replaced *lower*, *upper* and *capitalize* cases with *snake_case*, *kebab-case*, *camelCase* and *UpperCamelCase*
	- Removed `C_Cpp.classesCreator.folder.defaultSourcesFolder` property
	- Removed `C_Cpp.classesCreator.folder.defaultHeadersFolder` property
	- Renamed `C_Cpp.classesCreator.folder.detectHeadersFolder` property to `C_Cpp.classesCreator.folder.defaultHeaderFolders`
	- Renamed `C_Cpp.classesCreator.folder.detectSourcesFolder` property to `C_Cpp.classesCreator.folder.defaultSourceFolders`
	- Changed license from GPL v3.0 to MIT

- ### 0.1.1
	- Creation by hotkey
	- Parsing of input like
		```C++
		class Containers::MyContainer<T, U> : Container, IDisposable
		```
	- Automatically detection of `include` and `source` folders.
	- Creation of files in different folders.
	- Creation of folder that matches provided namespace.
	- Creation of folder that matches provided class.
	- Checking an existing namespace folder.
	- `#pragma once` and `#ifndef` guarders.
	- `.hpp` and `h`, `.cxx` and `.cpp` extensions.
	- Applying lower, upper cases or capitalization to files and folders names.

- ### 0.1.0
	- Initial release.

## Licence 

[MIT](https://github.com/Novaturion/cpp-classes-creator/blob/main/LICENSE).
