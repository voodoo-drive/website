# Interceptor.js

###### Latest version: v0.2.0
> Interceptor.js is a JavaScript framework that provides the ability to intercept a JavaScript function call.


## What does it do? 
Let's look at the hello world example
```js
var hi = function(name){ return "Hello " + name ;}//
hi.call();
// => "Hello undefined" because we didn't pass in any arguments

//We can fix this by intercepting before the function call
Interceptor.intercept(hi, function(thisArg, targetFunc, argList){
	if(argList.length == 0 || argList[0] == undefined){
		argList[0] = "guest" ;
	}
});

hi.call();
// =>  "Hello guest" ! 	
hi.call(null, "World");
// => "Hello World" 
```
## Prerequisite and limitation
As you can see from the example above, the `hi` function is called by its `call` method. 

Indeed __Interceptor.js__ intercepts a function by overwriting its `call` and `apply` methods. 
Therefore, in order for the interception to be working, 
* it requires the caller to call the target function through its `call` or `apply` method.

## Programming APIs
#### Interceptor
- `Interceptor.intercept` - `function(targetFunc, preFunc, postFunc)`
	* `targetFunc` -  The target function that will be intercepted. One function can be intercepted as many times as desired and the last interception will be invoked first.
	* `preFunc` - `function(thisArg, targetFunc, argList)` - The function that will be 'pluged in' and will run __before__ the target function runs.
	    + `thisArg` - The `this` object in the context of the target function.
	    + `targetFunc` - Points to the target function.
	    + `argList` - An array of objects that will be the arguments to invoke the target function. 
	* `postFunc` - `function(thisArg, targetFunc, argList, returnVal)` - The function that will run __after__ the target function runs.
	    + `thisArg`, `targetFunc`, `argList` - Same as above.
	    + `returnVal` - The return value from the target function. If you want to return a different value to the caller, use `this.doReturn(myNewReturnValue)`.

- `Interceptor.revert` - `function(targetFunc)`
	* `targetFunc` - Revert the last interception on `targetFunc`.
  
  
- `Interceptor.revertAll` - `function(targetFunc)`
	* `targetFunc` - Revert all interceptions on `targetFunc`.

- `Interceptor.noConflict` - `function()` Restore the global variable `Interceptor` to its previous value and returns the reference of Interceptor.js
  
#### Interceptor.prototype
The `preFunc` and `postFunc` will be assigned to an instance of `Interceptor` class. Therefore within the context of these two functions you have access to the methods inherits from `Interceptor.prototype`.
* `Interceptor.prototype.doReturn` - `function(returnVal)` - Force to return the value `returnVal` instead of the one from target function. If called within `preFunc`, the call to the target function will be skipped. The `postFunc` will still run.
    + `reutrnVal` - The value to return.
* `Interceptor.prototype.doSkip` - `function()` - Skip the call to the target function. The `postFunc` will still run.

Another brief example
```js
var square = function(x){ return x * x ;};
square.call();
// => NaN
Interceptor.intercept(square, function(thisArg, targetFunc, argList){
	if(typeof argList[0] !== "number"){
		this.doReturn(undefined);
	}
});
square.call();
// => undefined
square.call(null, 2);
// => 4
// Now we intercept the return value
Interceptor.intercept(square, null,  function(thisArg, targetFunc, argList, ret){
	if(typeof ret !== "number"){
		this.doReturn(0);
	}
});
square.call();
// => 0
square.call(null, 2);
// => 4
```


