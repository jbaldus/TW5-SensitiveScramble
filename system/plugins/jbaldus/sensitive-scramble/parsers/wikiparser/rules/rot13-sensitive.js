/*\
created: 20210508202122053
type: application/javascript
title: $:/plugins/jbaldus/sensitive-scramble/parsers/wikiparser/rules/rot13-sensitive.js
tags: 
modified: 20210511035534021
module-type: wikirule

Wiki text inline rule for scrambling words that are in a list of sensitive words. Nothing special needs to be done when writing the tiddler to mark the sensitive words. Instead, they are defined in the tiddler $:/config/sensitive-scramble/sensitive-words, one per line. Actually, each line can be a regular expression, but it's probably easier to just stick to words. The words will be joined with a pipe when put into the regular expression. If the $:/config/sensitive-scramble/sensitive-words tiddler doesn't exist, or contains no words, then this rule will do nothing. 

If the word list changes, then a reload will be required.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function rot13(mystring, rotation_value=13) {
    return mystring.replace(/[a-zA-Z]/g, function(chr) {
        var start = chr <= 'Z' ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
        return String.fromCharCode(start + (chr.charCodeAt(0) - start + rotation_value) % 26);
    });
}
    
function wordToBoundedWord(word) {
    var boundedWord = word,
            frontBoundaryMark = /^(\\b)?/,
            backBoundaryMark = /(\\b)?$/,
            frontTildeTest = /^~/,
            backTildeTest = /(?<!\\)~$/;
    if (word === undefined) {
            return undefined;
    }
    if (frontTildeTest.test(word)) {
            boundedWord = boundedWord.replace(frontTildeTest, '');
    } else {
            boundedWord = boundedWord.replace(frontBoundaryMark, '\\b');
    }
    if (backTildeTest.test(word)) {
        boundedWord = boundedWord.replace(backTildeTest, '');
    } else {
            boundedWord = boundedWord.replace(backBoundaryMark, '\\b');
    }
    return boundedWord;
}

function unTildeWord(word) {
    return word.replace(/^~/, '').replace(/(?<!\\)~$/, '')
                            .replace(/^\\~/, '~').replace(/\\~$/, '~')
}

function getSensitiveRegExp() {
    var sensitiveWords = $tw.wiki.getTiddlerText("$:/plugins/jbaldus/sensitive-scramble/config/words","");
    sensitiveWords = sensitiveWords.trim().split('\n');
    sensitiveWords = sensitiveWords.map(line => line.trim());
    sensitiveWords = sensitiveWords.filter(line => line[0] != "#");
    sensitiveWords = sensitiveWords.filter(line => line != "");
    if ($tw.wiki.getTiddlerText("$:/plugins/jbaldus/sensitive-scramble/config/auto-wordify", "yes") != "no") {
        sensitiveWords = sensitiveWords.map(wordToBoundedWord);
    } else {
        sensitiveWords = sensitiveWords.map(unTildeWord);
    }
    return sensitiveWords.join('|');
}

exports.name = "sensitive-scramble";
exports.types = {inline: true};

exports.init = function(parser) {
    this.parser = parser;
    // Regexp to match
    this.sensitiveWords = getSensitiveRegExp();
    this.matchRegExp = new RegExp(this.sensitiveWords, "ig");
	console.log(this.matchRegExp);
    // If there are no sensitive words, don't match anything
    if (this.sensitiveWords.trim() === "") {
        // make the matchRegExp so crazy it will never match anything
        // without this, the this.matchRegExp will match everything and crash the page
        this.matchRegExp = /gwndowmrogiocvlsvowwhgavlkhowyyabgalkkj/;
    }
};

exports.parse = function() {
    // Move past the match
    this.parser.pos = this.matchRegExp.lastIndex;

    return [{
        type: "text",
        text: rot13(this.match[0])
    }];
};

})();
    