# css-in-js-loader

> Use CSS in JS with [postcss-js](https://github.com/postcss/postcss-js) in webpack

## Installation

```sh
npm i --save-dev css-in-js-loader
```

## But [postcss-loader](https://github.com/postcss/postcss-loader) already supports postcss-js as a parser?

If you're using [babel](https://github.com/babel/babel) to process your Javascript then [postcss-loader](https://github.com/postcss/postcss-loader) only transforms `.js` files one level deep, i.e. it doesn't transform that file's imports.

## Usage and Example

Put `css-in-js` between your CSS and JS loaders. `css-in-js-loader` detects if the file is a `.js` file and converts it to CSS using [postcss-js](https://github.com/postcss/postcss-js) so you can use your CSS loaders (e.g. [postcss-loader](https://github.com/postcss/postcss-loader)) normally.

Example webpack configuration:

```js
{
  loaders: [
    { test: /\.css$/, loader: 'css!postcss!css-in-js!babel' },
    { test: /\.css\.js$/, loader: 'css!postcss!css-in-js!babel' },
    { test: /\.js$/, loader: 'babel' },
  ],
}
```

Now you can write CSS in JS:

```js
import { minWidth } from './utils/media';
import { lap } from './breakpoints';

export default {  
  '.root': {
    background: 'blue',

    [minWidth(lap)]: {
      background: 'red',
    },
  },
};
```