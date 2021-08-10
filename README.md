> 🚩 **This project is archived!** 🚩
> 
> *I learned a lot from making what's here so far, but this is a niche that has already been satisfied and I won't learn much by finishing.*

<h1 align='center'>Monch</h1>

<p align='center'>
	<b>A library for easily manipulating bits and bytes in JavaScript</b>
</p>

<p align='center'>
	<a href='https://github.com/kognise/monch/blob/master/LICENSE.md'>
		<img src='https://img.shields.io/badge/license-MPL--2.0-brightgreen' alt='license' />
	</a>
	<a href='https://kognise.github.io/monch/'>
		<img src='https://img.shields.io/badge/typedoc-reference-informational' alt='typedoc' />
	</a>
	<a href='https://github.com/kognise/monch/actions'>
		<img src='https://img.shields.io/github/workflow/status/kognise/monch/TypeScript%20CI' alt='github actions' />
	</a>
	<a href='https://codecov.io/gh/kognise/monch'>
		<img src='https://codecov.io/gh/kognise/monch/branch/master/graph/badge.svg' alt='codecov' />
	</a>
	<!-- <a href='https://repl.it/github/https://github.com/superwhiskers/crunch?ref=button'>
		<img src='https://img.shields.io/badge/try%20it%20on-repl.it-%2359646A.svg' alt='try it on repl.it' />
	</a> -->
</p>

## Features

- **Feature-rich**: supports reading and writing integers of varying sizes
- **Performant**: performs super duper fast, benchmarks are coming soon
- **Simple**: has a consistent and easy-to-use api
- **Licensed under the MPL-2.0**: use it anywhere you wish, just don't change it privately

## Example

```js
const buffer = new MonchBuffer()
const encoder = new TextEncoder()

buffer.grow(12)
buffer.writeBytesNext(encoder.encode('hello, world'))
console.log(buffer.toArray())
```

## Acknowledgements

This is a remake of [crunch by superwhiskers](https://github.com/superwhiskers/crunch/) in pure TypeScript. All credit to the idea and original implementation goes to them.

🙃
