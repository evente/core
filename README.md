[![Maintainability](https://badgen.net/codeclimate/maintainability/evente/core)](https://codeclimate.com/github/evente/core)
[![Test Coverage](https://badgen.net/codeclimate/coverage/evente/core)](https://codeclimate.com/github/evente/core)
[![Build Status](https://badgen.net/travis/evente/core)](https://travis-ci.org/evente/core)
![Size](https://badgen.net/badgesize/normal/evente/core/master/dist/evente.min.js)
![GZip Size](https://badgen.net/badgesize/gzip/evente/core/master/dist/evente.min.js)

`Evente` - javascript library for building reactive web applications. Library is suitable for writing web applications from scratch and also for using in existing applications. Its size is very small and cause low impact on the loading time.

# Features
- `jQuery`-like objects with subset of well known methods: `addClass`, `attr`, `closest`, `contains`, `end`, `find`, `get`, `hasClass`, `html`, `is`, `parent`, `removeClass`, `text`, `toggleClass`, `val`
- Custom listeners for `get`, `set` or `delete` operations with model properties
- Two way data binding
- Expressions with pipes for output modifications
- Working with HTTP resources using `fetch` and `promise`
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
    <div e-hide="rates">
        Loading data...
    </div>
    <!-- Calculator -->
    <div e-show="rates" style="display: none;">
        <input type="number" min="0" max="1000" placeholder="Amount" e-model="amount">
        <select e-for="name in names" e-model="base">
            <option value="{{ name }}">{{ name }}</option>
        </select>
        <br>
        <span>{{ amount * rates[currency] / rates[base] | currency:precision }}</span>
        <select e-for="name in names" e-model="currency">
            <option value="{{ name }}">{{ name }}</option>
        </select>
        <br>
        <span>Precision</span>
        <input type="number" min="0" max="6" e-model="precision">
    </div>

    <!-- Evente library -->
    <script src="https://cdn.jsdelivr.net/gh/evente/core/dist/evente.min.js"></script>

    <!-- Application code -->
    <script>
        // Pipes
        evente.pipes.currency = (params) => {
            return parseFloat(params[0]).toFixed(params[1] !== undefined ? params[1] : 2);
        }
        // Init
        var app = evente('body', {
            amount: '1',
            currency: 'USD',
            precision: 2
        });
        // Load data
        evente.resource('https://api.exchangeratesapi.io/latest').get().then(data => {
            data.rates[data.base] = 1;
            app.data.base = data.base;
            app.data.rates = data.rates;
            app.data.names = Object.keys(data.rates).sort();
        });
    </script>

</body>
</html>
```
