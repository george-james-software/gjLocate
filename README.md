[![](https://img.shields.io/badge/InterSystems-IRIS-blue.svg)](https://www.intersystems.com/products/intersystems-iris/)
[![](https://img.shields.io/badge/InterSystems-Ensemble-blue.svg)](https://www.intersystems.com/products/ensemble/)
[![](https://img.shields.io/badge/InterSystems-Caché-blue.svg)](https://www.intersystems.com/products/cache/)


# gj&nbsp;::&nbsp;locate

Use gj&nbsp;::&nbsp;locate to get to the source of your errors.

Using VS Code, with either the Serenji extension or the basic InterSystems objectscript extension, click on the gj&nbsp;::&nbsp;locate caption in the status bar. &nbsp;Enter an objectscript error message or a line reference from a class or .mac routine. &nbsp;Then gj&nbsp;::&nbsp;locate will take you directly to the corresponding line in your source code.

## Features

### Debugging 101
The first step in debugging any error is to make sure you are looking at the correct line of code. &nbsp;Error messages give the error location in terms of the compiled .int code, not your source code. &nbsp;There are many special rules about how lines of source code map to corresponding lines in the compiled .int routines and most people don't know them all. &nbsp;Locating the correct source line for an error is an essential first step in debugging any problem. &nbsp;gj&nbsp;::&nbsp;locate solves this problem by converting the location of an error in compiled .int code to the corresponding location in your source, and then taking you there.

Simply copy and paste any InterSystems IRIS error message into gj&nbsp;::&nbsp;locate and it will take you directly to the corresponding source line.

### But wait, there's more!

It doesn't just work with error messages. &nbsp;You can use gj&nbsp;::&nbsp;locate to open any class or routine and go straight to the line you want. &nbsp;For example, you can enter alpha^Greek.Alphabet to go to the alpha method in Greek.Alphabet.cls.

You can specify a location using any of these formats to get quickly and directly to where you want to be:
 * Package.Class
 * Package.Class.cls
 * ^Package.Class
 * method^Package.Class
 * method+offset^Package.Class
 * method (in currently opened class)
 * method+offset (in currently opened class)
 * routine.mac
 * routine.inc
 * routine.int
 * ^routine
 * label^routine
 * label+offset^routine
 * +offset^routine
 * label (in currently opened routine)
 * label+offset (in currently opened routine)
 * +offset (in currently opened routine)

### And one more thing...

If you install the gj&nbsp;::&nbsp;locate userscript in your browser, you can navigate seamlessly from an error message in the Management Portal Application Error Log to the source code in just two clicks.

Like this:

![Using gj::locate](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/demo1.gif)


## Requirements

This extension requires either the Serenji extension or the basic InterSystems Objectscript extension to be installed.


## Installation

1. To install the gj&nbsp;::&nbsp;locate VS Code extension, go to the Extensions view (⌘/Ctrl+Shift+X), search for "gjLocate" and click the install button.

2. Once installed a gj&nbsp;::&nbsp;locate caption will appear on the status bar. &nbsp;Click it to invoke gj&nbsp;::&nbsp;locate. 

3. Please read the note in [Known Limitations and Issues](#known-limitations-and-issues) if you are using multi-root workspaces.

4. Finally, we found it useful to associate a keyboard shortcut with the gj&nbsp;::&nbsp;locate command. &nbsp;Our preference is Alt+Z Alt+P since, to some extent, gj&nbsp;::&nbsp;locate mimics the ObjectScript zprint command.

### Optionally install the gj&nbsp;::&nbsp;locate Userscript

If you install the gj&nbsp;::&nbsp;locate userscript in your browser, you will be able to copy error messages from any InterSystems Management Portal (all versions of IRIS, Ensemble and Caché going back to 2007) and paste them into VS Code with just two clicks

1. Install a userscript manager such as Tampermonkey. &nbsp;Follow the instructions [here](https://www.tampermonkey.net/). &nbsp;This is a plugin for your browser that allows you to install and manage [userscripts](https://en.wikipedia.org/wiki/Userscript).

2. Install the gj&nbsp;::&nbsp;locate userscript by clicking the **Install This Script** button on [this page](https://greasyfork.org/en/scripts/424973-gj-locate).

3. Navigate to the Application Error Log page in any InterSystems Management Portal. &nbsp;You'll see an additional gj&nbsp;::&nbsp;locate button against each error log entry. &nbsp;Click it.


### Why?

Surely it can't be that difficult to get from label+offset^routine to the actual source line responsible for the error? &nbsp;For an expert it isn't that hard ... most of the time. &nbsp;But there are enough oddities and special rules that even an expert can get it badly wrong.

Take, for example, the following error message:

    set characterCount = characterCount + 1
    <UNDEFINED>zeta+5^Greek.Alphabet.1 *characterCount

It's 2:30am and you've just been woken up to fix a mission critical problem in your Greek Alphabet application. &nbsp;How do you find the corresponding source code line for this error?

First you have to know a few things. &nbsp;Like, you have to know that when a routine ends with a period followed by a number it means it's a class, not a routine. &nbsp;So now you go open up Greek.Alphabet.cls.


![Greek.Alphabet.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Alphabet.png)


Yes, the error message says the problem is in the Greek.Alphabet class, but as you can see, it's empty.

Closer inspection reveals that the source code must have come from one of the superclasses. &nbsp;Greek.Zeta.cls would be a good guess. &nbsp;Let's look in there.


![Greek.Zeta.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Zeta.png)


Well, here we are. &nbsp;It's obviously line 10 which is zeta+5. &nbsp;But hang on, the error message was `<UNDEFINED>` and the undefined variable is characterCount. &nbsp;How can that possibly be? &nbsp;characterCount is clearly being set on the previous line. &nbsp;This error is impossible!

It's now 3am and you are feeling a bit challenged!

Then you remember! Methods are given a z prefix when compiled into an .int routine. &nbsp;Aha! &nbsp;Zeta is the 6th letter of the Greek alphabet, but the 7th letter is Eta. &nbsp;We should be looking for a method called eta.

Let's look at Greek.Eta.cls


![Greek.Eta.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Eta.png)


Hmm. &nbsp;It's nearly identical to Greek.Zeta.cls and characterCount has clearly been initialised on the previous line. &nbsp;What's going on? &nbsp;At this point you just want to go back to bed.

More head scratching. Perhaps the problem is something to do with that #include line. &nbsp;Let's look in there.


![Greek.Utils.inc](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Utils.png)


Line 5 looks promising. &nbsp;But... oh no, characterCount can't be undefined here. &nbsp;It's impossible.

So, eventually, after scolling down 20 or so lines you find some more code:


![Greek.Utils.inc line 20](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Utils_2.png)


Now we know why characterCount is undefined, and fortunately it looks like an easy fix.

The real error is at line 25 of Greek.Utils.inc. &nbsp;This is a somewhat contrived example that spotlights some of the many gotchas you might encounter. &nbsp;Getting from an error message to the corresponding source line can be difficult, especially at 3am. 

So finally, here's how you'd do it with gj&nbsp;::&nbsp;locate


![Using gj::locate](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/demo2.gif)



## Known Limitations and Issues

 * If you have a multi-root workspace then gj&nbsp;::&nbsp;locate will only operate on the first folder. &nbsp;You can drag a folder to change its order and make it the first one in your workspace if you need to.
 * If you are using Serenji, gj&nbsp;::&nbsp;locate will only operate on Serenji folders that contain a single namespace. &nbsp;If you have a multi-namespace connection, you can add an additional single namespace connection and make it the first folder in your workspace. 

The source location is determined using an empirical method. This approach has a number of limitations that are unlikely to be encountered in most normal cases. &nbsp;If however, you are doing something exotic, the results may be affected. &nbsp;Generally, using the Serenji extension instead of the basic InterSystems Objectscript extension will give better results because it is able to access source code that has not been downloaded to the client. 

 * Macro #if directives are ignored. &nbsp; Any code lines within and after a #if block may be incorrect
 * $$$ macros that resolve to multiple lines are not accounted for. &nbsp;Most $$$ macros resolve to a line fragment which will be handled correctly. &nbsp;Multiline macros are not common.
 * Method code containing a line comprising just } would be mis-identified as the end of a method block.
 * Lines that contain the terminating > of a &js<> block and have code or comments following the > are not handled correctly
 * Generator methods can result in an unknown number of lines of code. &nbsp;gj&nbsp;::&nbsp;locate will navigate to the method but not to a specific line within a generator method.
 * htmlMarkers (eg &htmlABC< ... >CBA ) are not recognised as &html<> blocks and not treated correctly.
 * ##sql( ... ) as an alternative to &sql( ... ) is not recognised
 * The specific sql construct &sql( /* in-line comment */ ) is not handled correctly


## Release Notes

### 1.0.0

First release. &nbsp;Shiney and new.

