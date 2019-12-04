/**

	Interceptor 0.1 
		Intercepts function calls by overwriting Function.prototype.call and Function.prototype.apply
		The performance is just too bad. Not practical.
*/

(function(global, module){
	var registry = {};
	var interceptorList = [];
	var matchProbe = function(){ return false ;};
	// interceptorList._push = interceptorList.push;
	
	/** Function constants */
	var SKIP = function(){ return "Skips the target function. "};
	var NOSKIP = function(){ return "Continue to run target function. "};
	/* 	1. before all functions call.
		2. after all function call.
		3. before one function call.
		4. after one function call.
		5. customized matcher.
			* before
			* after

		Interceptors should be 'chainable'
	*/
	var Interceptor = function(matcherFunc){
		matcherFunc = matcherFunc || function(){ return false ;};
		this.matcher = new Matcher(matcherFunc);
		this.runtimeState = undefined;
	};

	var RuntimeState = Interceptor.RuntimeState = function(){
		this.returnVal = undefined ;
		this.skipTarget = false ;
		this.chainedInterceptors = [];
	};

	RuntimeState.prototype ={
		finalize: function(){
			for(var i in this.chainedInterceptors){
				this.chainedInterceptors[i].releaseRuntimeState() ;
			}
			this.chainedInterceptors = undefined;
		},
		chainInterceptor: function(interceptor){
			this.chainedInterceptors.push(interceptor) ;
		}
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
		setRuntimeState: function(rtState){
			this.runtimeState = rtState;
			rtState.chainInterceptor(this);
		},
		releaseRuntimeState: function(){
			this.runtimeState = undefined ;
		},
		/** Skip the target function and return returnVal */
		returnValue: function(returnVal){
			this.runtimeState.returnVal = returnVal ;
			this.runtimeState.skipTarget = true ;
		},

		skipTarget: function(){
			this.runtimeState.skipTarget = true ;
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
	var doInterceptPreCall = function(thisArg, targetFunc, argList, runtimeState){

		for(var i = 0 ; i < interceptorList.length; i ++){
			var interceptor = interceptorList[i];
			var matched = false;
			interceptor.setRuntimeState(runtimeState);
			try{
				matched = interceptor.matcher.evaluate(thisArg, targetFunc, argList);
			}catch(e){
				//warn e
				//TODO
				console.error(e);
			}

			if(matched){
				interceptor.interceptPreCall(thisArg, targetFunc, argList);
				if(runtimeState.skipTarget){
					//return false ;
					// If any interceptor skips the target function, break and return 
					break ;
				}
			}
		}
	};	

	/**
		Finds all the interceptors that match the current target function and run their interceptPostCall() function one by one.
		@returns {Object} an object that overwrites the return value of the target function.
	*/
	var doInterceptPostCall = function(thisArg, targetFunc, argList, returnVal){
		for(var i in interceptorList){
			var interceptor = interceptorList[i];
			var passed = false;
			try{
				interceptor.matcher.evaluate(thisArg, targetFunc, argList);
			}catch(e){
				//warn e
				//TODO
				console.error(e);
			}

			// manipulates returnVal
			if(passed){
				returnVal = interceptor.interceptPostCall(thisArg, targetFunc, argList, returnVal);
			}
		}
		return returnVal ;
	};	

	/** 
	 *	Overwrites Function.prototype.call()
	 */
	var _call = Function.prototype.call ;
	var _apply = Function.prototype.apply ;
	var _bind = Function.prototype.bind ;
	_bind.apply = _apply ;

	Interceptor.start = function(){

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
			runtimeState.finalize();
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
			runtimeState.finalize();
			return runtimeState.returnVal ;
		};
	};

	Interceptor.end = function(){
		Function.prototype.call = _call ;
		Function.prototype.apply = _apply ;
	};

	Interceptor.interceptPreAll = function(interceptorFunc){
		if(interceptorFunc){
			var intcpt = new Interceptor(function(){return true ;});
			intcpt.interceptPreCall = interceptorFunc || intcpt.interceptPreCall;
			interceptorList.push(intcpt);
		}
	}

	Interceptor.interceptPre = function(targetFunc, interceptorFunc){

		if(targetFunc && interceptorFunc){

			var intcpt = new Interceptor(function(thisArg, target){return target === targetFunc;});
			intcpt.interceptPreCall = interceptorFunc || intcpt.interceptPreCall;
			interceptorList.push(intcpt);
			// interceptorList[interceptorList.length] = intcpt ;
		}
	}

	var argsToArray = function(args){
		var arr = [];
		if(args && args.length)
		for(var i = 0 ;i < args.length; i ++){
			arr.push(args[i]);
		}
		return arr ;
	};

	global.Interceptor= (module || {}).exports = Interceptor;

})(typeof window !== "undefined"? window: {}, typeof module !== "undefined"? module: undefined);