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
| `C_Cpp.classesCreator.folder.nameCase`				| **enum**		| *lower*			| Which case will be applyed to folders names.	|
| `C_Cpp.classesCreator.folder.defaultHeadersFolder`	| **string**	| *null*			| Specifies the path where the header file will be created. Must be relative to project folder.<br>**Ignored if `splitByFolders` is *false* or creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.defaultSourcesFolder`	| **string**	| *null*			| Specifies the path where the source file will be created. Must be relative to project folder.<br>**Ignored if `splitByFolders` is *false* or creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.detectHeadersFolder`		| **string[]**	| *inc, include*	| List of headers folders names that can exists in root folder.<br>**Ignored if creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.detectSourcesFolder`		| **string[]**	| *src, source*		| List of source folders names that can exists in root folder.<br>**Ignored if creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.createClassFolder`		| **boolean**	| *false*			| Create a folder for the class. If `splitByFolders` is *true* and two folders for both source and header files will be created.<br>**Ignored if creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.createNamespaceFolder`	| **boolean**	| *true*			| Create a folder for the namespace if doesn't exists in provided path. If `splitByFolders` is *true* and two folders for both source and header files will be created.<br>**Ignored if creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.splitByFolders`			| **boolean**	| *true*			| Place header under `defaultHeadersFolder` folder and source file under `defaultSourceFolder`.<br>**Ignored if creation was called from the context menu**.	|
| `C_Cpp.classesCreator.folder.detectFolders`			| **boolean**	| *true*			| Enable detection of *include* and *source* folders based on `detectFoldersHeaders` and `detectFoldersSources` lists.	|
| `C_Cpp.classesCreator.file.useCppHeader`				| **boolean**	| *true*			| Use *.hpp* instead of *.h*.	|
| `C_Cpp.classesCreator.file.useCxxSource`				| **boolean**	| *false*			| Use *.cxx* instead of *.cpp*.	|
| `C_Cpp.classesCreator.header.usePragma`				| **boolean**	| *true*			| Use `#pragma once`.	|
| `C_Cpp.classesCreator.header.useDefine`				| **boolean**	| *false*			| Use `#ifndef`.	|

<br>

## Known Issues

Add an [issue](https://github.com/Novaturion/cpp-classes-creator/issues)

## Release Notes

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

[GPL 3](https://github.com/Novaturion/cpp-classes-creator/blob/main/LICENSE).

**Enjoy!**
