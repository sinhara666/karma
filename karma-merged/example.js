// example.js — demonstrates linter highlights (tabs, trailing whitespace, unclosed brace)

function greet() {
	console.log("Hello, world")	   // contains a tab and trailing whitespace

const longLine = "This is a deliberately long line intended to exceed the 120 character limit enforced by the lightweight linter so you can see the warning appear in the output when you run the tool locally."

greet();
