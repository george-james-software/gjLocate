[![](https://img.shields.io/badge/InterSystems-IRIS-blue.svg)](https://www.intersystems.com/products/intersystems-iris/)
[![](https://img.shields.io/badge/InterSystems-Ensemble-blue.svg)](https://www.intersystems.com/products/ensemble/)
[![](https://img.shields.io/badge/InterSystems-Caché-blue.svg)](https://www.intersystems.com/products/cache/)


# gj :: locate

Use gj :: locate to get to the source of your errors.

Using VS Code with either the Serenji extension or the basic InterSystems objectscript extension, click on the gj :: locate caption in the status bar, enter an objectscript error message or a line reference from an .int routine.  gj :: locate will take you the corresponding line in your source code.

## Features

### Debugging 101
The first step in debugging any error is to make sure you are looking at the correct line of code.  Error messages give the error location in the compiled .int code, not in your source code.  There are many special rules about how lines of source code map to corresponding lines in the compiled .int routines and you probably don't know them all.  Locating the correct source line for an error is an essential first step in debugging any problem.

Simply copy and paste any InterSystems IRIS error message into gj :: locate and it will take you directly to the corresponding source line.

### But Wait! There's more

You can use gj :: locate to open any class or routine and go straight to the line you want.  For example you can enter alpha^Greek.Alphabet to go to the alpha method in Greek.Alphabet.cls.

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

You can, optionally, install the gj :: locate userscript in your browser (you'll need the Tampermonkey browser extension to do this). Then you can navigate seamlessly from an error message in the Management Portal Application Error Log to the source code in just two clicks. Like this:

![Using gj::locate](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/demo1.gif)

## Requirements

This extension requires either the Serenji extension or the basic InterSystems Objectscript extension to be installed.


## Installation

To install the gj :: locate VS Code extension, go to the Extensions view (⌘/Ctrl+Shift+X), search for "gjLocate" and click the install button.  

Once installed a gj :: locate caption will appear on the status bar.  Click it to invoke gj :: locate. 

Please read the note in [Known Limitations and Issues](#known-limitations-and-issues) if you are using multi-root workspaces.

Finally, we find it useful to associate a keyboard shortcut with the gj :: locate command.  Our preference is Alt+Z Alt+P since, to some extent, gj :: locate mimics the ObjectScript zprint command.

### Optionally install the gj :: locate Userscript

You can, optionally, install the gj :: locate userscript in your browser.  This will enable you to copy error messages from any InterSystems Management Portal (all versions of IRIS, Ensemble and Caché going back to 2007) and paste them into VS Code with just two clicks.

1. Install a userscript manager such as Tampermonkey.  Follow the instructions [here](https://www.tampermonkey.net/).  This is a plugin for your browser that allows you to install and manage [userscripts](https://en.wikipedia.org/wiki/Userscript).

2. Install the gj :: locate userscript by clicking the **Install This Script** button on [this page](https://greasyfork.org/en/scripts/424973-gj-locate).

3. Navigate to the Application Error Log page in any InterSystems Management Portal.  You'll see an additional gj :: locate button against each error log entry.  Click it.


## Known Limitations and Issues

 * If you have a multi-root workspace then gj :: locate will only operate on the first folder.  You can drag a folder to change its order and make it the first one in your workspace if you need to.
 * If you are using Serenji gj :: locate will only operate on Serenji folders that contain a single namespace.  If you have a multi-namespace connection, you can add an additional single namespace connection and make it the first folder in your workspace. 

The source location is determined using an empirical method.  This approach has a number of limitations that
are unlikely to be encountered in most normal cases, but if you are doing something exotic the results may
be affected.  Generally, using the Serenji extension instead of the basic InterSystems Objectscript extension will give better results.

 * Macro #if directives are ignored.   Any code lines within and after a #if block may be incorrect
 * $$$ macros that resolve to multiple lines are not accounted for.  Most $$$ macros resolve to a line fragment which will be handled correctly.  Multiline macros are not common.
 * Method code containing a line comprising just } would be mis-identified as the end of a method block.
 * Lines that contain the terminating > of a &js<> block and have code or comments following the > are not handled correctly
 * Generator methods can result in an unknown number of lines of code.  gj :: locate will navigate to the method but not to a specific line within a generator method.
 * htmlMarkers (eg &htmlABC< ... >CBA ) are not recognised as &html<> blocks and not treated correctly.
 * ##sql( ... ) as an alternative to &sql( ... ) is not recognised
 * The specific sql construct &sql( /* in-line comment */ ) is not handled correctly


### Why?

Surely it can't be that difficult to get from label+offset^routine to the actual source line responsible for the error?  For an expert it isn't that hard ... most of the time.  But there are enough oddities and special rules that even an expert can get it badly wrong.

Take, for example, the following error message:

    set characterCount = characterCount + 1
    <UNDEFINED>zeta+5^Greek.Alphabet.1 *characterCount
 
It's 2:30am and you've just been woken up to fix a mission critical problem in your Greek Alphabet application.  How do you find the corresponding source code line for this error?

First you have to know a few things.  You have to know that when a routine ends with .1 it means that this is a class, not a routine.  So now you go open up Greek.Alphabet.cls.


![Greek.Alphabet.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Alphabet.png)


Yes, the error message says the problem is in the Greek.Alphabet class, but as you can see, it's empty.

Closer inspection reveals that the source code must have come from one of the superclasses.  Greek.Zeta.cls would be a good guess.  Let's look in there.


![Greek.Zeta.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Zeta.png)


Well, here we are.  It's obviously line 10 which is zeta+5.  But hang on, the error message was `<UNDEFINED>` and the undefined variable is characterCount.  How can that possibly be?  characterCount is clearly being set on the previous line.  This error is impossible!

It's now 3am and you are feeling a bit challenged!

Then you remember! Methods are given a z prefix when compiled into an .int routine.  Aha!  Zeta is the 6th letter of the Greek alphabet, but the 7th letter is Eta.  We should be looking for a method called eta.

Let's look at Greek.Eta.cls


![Greek.Eta.cls](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Eta.png)


Hmm.  It's nearly identical to Greek.Zeta.cls and characterCount has clearly been initialised on the previous line.  What's going on?  At this point you just want to go back to bed.

More head scratching. Perhaps the problem is something to do with that #include line.  Let's look in there.


![Greek.Utils.inc](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Utils.png)


Line 5 looks promising.  But... oh no, characterCount can't be undefined here.  It's impossible.

So, eventually, after scolling down 20 or so lines you find some more code:


![Greek.Utils.inc line 20](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/Greek.Utils_2.png)


Now we know why characterCount is undefined, and fortunately it looks like an easy fix.

The real error is at line 25 of Greek.Utils.inc.  This is a somewhat contrived example that spotlights some of the many gotchas you might encounter.  Getting from an error message to the corresponding source line can be difficult, especially at 3am. 

So finally, here's how you'd do it with gj :: locate


![Using gj::locate](https://raw.githubusercontent.com/george-james-software/gjLocate/master/images/demo2.gif)



## Release Notes

### 1.0.0

First release.  Shiney and new.

