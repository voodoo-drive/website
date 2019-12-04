/**

	Interceptor 0.2 - intercept function calls by overwriting the target function's apply and call method.
*/

(function(global, module){
	"use strict";
	/* 
		1. before one function call.
		2. after one function call.
		3. customized matcher.
			* before
			* after
	*/
	var Interceptor = function(matcherFunc){
		matcherFunc = matcherFunc || function(){ return false ;};
		this.matcher = new Matcher(matcherFunc);
		this.runtimeState = undefined;
		this.target = undefined ;
		//this.
	};

	Interceptor.prototype = {
		constructor: Interceptor,
		interceptPreCall: function(thisArg, targetFunc, argList){
			/* this points to the Interceptor object */
			/**
				Return this.SKIP to skip the invocation of the target function.
				This will also skip all the interceptors chained after this.
				Returning undefined is the same as returning this.NOSKIP and will 
				continue to run the target function.
			*/
		},
		interceptPostCall: function(thisArg, targetFunc, argList, returnVal){
			/* this points to the Interceptor object */
			/**
				
			*/

			return returnVal ;
		},
		attachRuntimeState: function(runtimeState){
			this.runtimeState = runtimeState;
			runtimeState.chainInterceptor(this);
		},
		detachRuntimeState: function(){
			this.runtimeState = undefined ;
		},
		/** Skip the target function and return returnVal */
		doReturn: function(returnVal){
			this.runtimeState.returnVal = returnVal ;
			this.runtimeState.skipTarget = true ;
		},

		doSkip: function(){
			this.runtimeState.skipTarget = true ;
		}

	};


	var RuntimeState = Interceptor.RuntimeState = function(){
		this.returnVal = undefined ;
		this.skipTarget = false ;
		this.chainedInterceptors = [];
	};

	RuntimeState.prototype ={
		finalize: function(){
			for(var i in this.chainedInterceptors){
				this.chainedInterceptors[i].detachRuntimeState() ;
			}
			this.chainedInterceptors = [];
		},
		chainInterceptor: function(interceptor){
			this.chainedInterceptors.push(interceptor) ;
		}
	};


	/** Matcher constructor */
	var Matcher = Interceptor.Matcher = function(evalFunc){
		if(evalFunc){
			this.evaluate = evalFunc;
		}
	};

	Matcher.prototype = {
		evaluate: function(thisArg, targetFunc, argList){

		}
	};

	/**
		Finds all the interceptors that match the current target function and run their interceptPreCall() function.
		@returns {Interceptor.RuntimeState} Whether continue the invocation of the target function. 
	*/
	var doInterceptPreCall = function(thisArg, targetFunc, argList, runtimeState, interceptor){

		//var interceptor //= interceptorList[i];
		interceptor.attachRuntimeState(runtimeState);
		interceptor.interceptPreCall(thisArg, targetFunc, argList);
		
	};	

	/**
		Finds all the interceptors that match the current target function and run their interceptPostCall() function one by one.
		@returns {Object} an object that overwrites the return value of the target function.
	*/
	var doInterceptPostCall = function(thisArg, targetFunc, argList, runtimeState, interceptor){
		interceptor.attachRuntimeState(runtimeState);
		interceptor.interceptPostCall(thisArg, targetFunc, argList, runtimeState.returnVal);
	};	

	/** 
	 *	Overwrites Function.prototype.call()
	 */
	var _call = Function.prototype.call ;
	var _apply = Function.prototype.apply ;
	var _bind = Function.prototype.bind ;
	_bind.apply = _apply ;

	/** Returns a wrapped call function that is already intercepted by the interceptor */
	var callFactory = function(_call, interceptor){
		var newCall = function call(arg){
			var thisArg = arguments[0];
			var argList = argsToArray(arguments);
			if (arguments.length > 0){
				argList.shift();
			}
			var runtimeState = new RuntimeState();
			//interceptPreCall
			doInterceptPreCall(thisArg, this, argList, runtimeState, interceptor);
			// for call to the target function
			if(arguments.length > 0 || argList.length > 0){
				argList.unshift(thisArg);
			}
			
			if(!runtimeState.skipTarget){
				// call the function.
				//runtimeState.returnVal = (_apply.bind(this))(thisArg, argList);
				
				runtimeState.returnVal = _call.apply(this, argList);
			}
			// for post call
			if (arguments.length > 0 || argList.length > 0){
				argList.shift();
			}
			//interceptPostCall
			doInterceptPostCall(thisArg, this, argList, runtimeState, interceptor);
			
			var returnVal = runtimeState.returnVal ;
			runtimeState.finalize();
			return returnVal ;
		};
		newCall._call = _call ;
		return newCall;
	};

	/** Returns a wrapped apply function that is already intercepted by the interceptor */
	var applyFactory = function(_apply, interceptor){
		var newApply = function apply(arg1, arg2){
			var thisArg = arguments[0];
			var argList;
			switch(arguments.length){
				case 0:
				case 1:
					argList = [];			
					break;
				case 2:
				default:
				argList = arguments[1];	
				
			}

			var runtimeState = new RuntimeState();
			//interceptPreCall
			doInterceptPreCall(thisArg, this, argList, runtimeState, interceptor);

			if(!runtimeState.skipTarget){
				// call the function.
				// runtimeState.returnVal = (_apply.bind(this))(thisArg, argList);
				runtimeState.returnVal = _apply.call(this, thisArg, argList);//this._apply(thisARg, argList)
			}

			//interceptPostCall
			doInterceptPostCall(thisArg, this, argList, runtimeState, interceptor);
			
			var returnVal = runtimeState.returnVal ;
			runtimeState.finalize();
			return returnVal ;
		};

		newApply._apply = _apply ;
		return newApply;
	};
	Interceptor.start = function(){
		
/*
		Function.prototype.call = function(){
			var thisArg = arguments[0];
			var argList = argsToArray(arguments) ;
			if (argList.length > 1){
				argList.shift();
			}
			var runtimeState = new RuntimeState();
			//interceptPreCall
			doInterceptPreCall(thisArg, this, argList, runtimeState);

			if(!runtimeState.skipTarget){
				// call the function.
				runtimeState.returnVal = (_apply.bind(this))(thisArg, argList);
			}

			//interceptPostCall
			// ret = doInterceptPostCall(thisArg, this, argList, ret);
			// run
			return runtimeState.returnVal ;
		};

			
		Function.prototype.apply = function(){
			var thisArg = arguments[0];
			var argList;
			switch(arguments.length){
				case 0:
				case 1:
					argList = [];			
					break;
				case 2:
				default:
				argList = arguments[1];	
				
			}

			var runtimeState = new RuntimeState();
			//interceptPreCall
			doInterceptPreCall(thisArg, this, argList, runtimeState);

			if(!runtimeState.skipTarget){
				// call the function.
				runtimeState.returnVal = (_apply.bind(this))(thisArg, argList);
			}

			//interceptPostCall
			// ret = doInterceptPostCall(thisArg, this, argList, ret);
			return runtimeState.returnVal ;
		};
*/
	};

	Interceptor.end = function(){
		// Function.prototype.call = _call ;
		// Function.prototype.apply = _apply ;
	};


	Interceptor.intercept = function(targetFunc, preFunc, postFunc){
		if(typeof targetFunc !== "function"){
			throw Error("No target function specified.")
		}
		var interceptor = new Interceptor(function(thisArg, target){return target === targetFunc;});
		//preFunc
		if(typeof preFunc === "function"){
			interceptor.interceptPreCall = preFunc ;
		}
		//postFunc
		if(typeof postFunc === "function"){
			interceptor.interceptPostCall = postFunc ; 
		}

		targetFunc.call = callFactory(targetFunc.call, interceptor);
		targetFunc.apply = applyFactory(targetFunc.apply, interceptor);
	}

	Interceptor.isIntercepted = function(targetFunc){
		return targetFunc.call && targetFunc.call._call || targetFunc.apply && targetFunc.apply._apply ;
	}

	/** Revert the interception once */
	Interceptor.revert = function(targetFunc){
		if(targetFunc && targetFunc.call && targetFunc.call._call){
			targetFunc.call = targetFunc.call._call ;
		}

		if(targetFunc && targetFunc.apply && targetFunc.apply._apply){
			targetFunc.apply = targetFunc.apply._apply ;
		}
	};

	Interceptor.revertAll = function(targetFunc){
		if(targetFunc && targetFunc.call && targetFunc.call._call){
			while(targetFunc.call._call){
				targetFunc.call = targetFunc.call._call ;
			}
		}

		if(targetFunc && targetFunc.apply && targetFunc.apply._apply){
			targetFunc.apply = targetFunc.apply._apply ;
		}
	};

	var argsToArray = function(args){
		var arr = [];
		if(args && args.length)
		for(var i = 0 ;i < args.length; i ++){
			arr.push(args[i]);
		}
		return arr ;
	};

	var _Interceptor = global.Interceptor;
	Interceptor.noConflict = function(){
		global.Interceptor = _Interceptor ;
		return Interceptor ;
	};
	global.Interceptor = module.exports = Interceptor;

})(typeof window !== "undefined"? window: {}, typeof module !== "undefined"? module: {});