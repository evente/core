[![Maintainability](https://api.codeclimate.com/v1/badges/ac63ded77785e7f4b325/maintainability)](https://codeclimate.com/github/rc-js/core/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ac63ded77785e7f4b325/test_coverage)](https://codeclimate.com/github/rc-js/core/test_coverage)
[![Build Status](https://travis-ci.org/rc-js/core.svg?branch=master)](https://travis-ci.org/rc-js/core)

`rc` - javascript library for building reactive web applications. Library is suitable for writing web applications from scratch and also for using in existing applications. And it is very small - `21k minified` and `6.2k gzipped` so it cause very low impact on the time of application loading.

# Features
- `jQuery`-like objects with subset of well known methods: `addClass`, `attr`, `closest`, `contains`, `end`, `find`, `get`, `hasClass`, `html`, `is`, `parent`, `removeClass`, `text`, `toggleClass`, `val`
- Custom listeners for `get`, `set` or `delete` operations with model properties
- Two way data binding
- Expressions with pipes for output modifications
- Working with HTTP resources using `fetch` and `promise`s
- Routing

# Getting started
Example application **Currency calculator**.
Try it on [CodePen](https://codepen.io/apoprotsky/pen/XOpzxV). Full application code see below.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Currency calculator</title>
    <style>
        input, select, span { font-size: 16px; }
        input, select { padding: 5px; margin-left: 5px; margin-top: 10px; width: 185px; }
        span { margin-left: 5px; width: 200px; display: inline-block; }
    </style>
</head>
<body>

    <h1>Currency calculator</h1>
    <!-- Loading -->
    <div rc-hide="rates">
        Loading data...
    </div>
    <!-- Calculator -->
    <div rc-show="rates" style="display: none;">
        <input type="number" min="0" max="1000" placeholder="Amount" rc-model="amount">
        <select rc-for="name in names" rc-model="base">
            <option value="{{ name }}">{{ name }}</option>
        </select>
        <br>
        <span>{{ amount * rates[currency] / rates[base] | currency:precision }}</span>
        <select rc-for="name in names" rc-model="currency">
            <option value="{{ name }}">{{ name }}</option>
        </select>
        <br>
        <span>Precision</span>
        <input type="number" min="0" max="6" rc-model="precision">
    </div>

    <!-- rc library -->
    <script src="https://cdn.jsdelivr.net/gh/rc-js/core/dist/rc.min.js"></script>

    <!-- Application code -->
    <script>
        // Pipes
        rc.pipes.currency = (params) => {
            return parseFloat(params[0]).toFixed(params[1] !== undefined ? params[1] : 2);
        }
        // Init
        var app = new rc.App('body', {
            amount: '1',
            currency: 'USD',
            precision: 2
        });
        // Run
        app.run();
        // Load data
        var resource = new rc.Resource('https://api.exchangeratesapi.io/latest');
        resource.get().then(data => {
            data.rates[data.base] = 1;
            app.data.base = data.base;
            app.data.rates = data.rates;
            app.data.names = Object.keys(data.rates).sort();
        });
    </script>

</body>
</html>
```
