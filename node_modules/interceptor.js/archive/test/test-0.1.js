
var test = new NUnit.Test("InterceptorJS Test Cases");

var startTime = -1, endTime = 1000;

test.before = function(){
	startTime = new Date().getTime();
};

test.after = function(){
	endTime = new Date().getTime();
	console.log("Time used: " + (endTime - startTime) + " ms.");
};

test.testStartEnd = function(a){
	var _apply = Function.prototype.apply ;
	var _call = Function.prototype.call ;
	
	Interceptor.start();
	
	a.neq(Function.prototype.apply, _apply);
	a.neq(Function.prototype.call, _call);

	Interceptor.end();

	a.strictEqual(Function.prototype.apply, _apply);
	a.strictEqual(Function.prototype.call, _call);

};

test.testInterceptPre = function(a){
	Interceptor.start();
	var obj = {};
	var func = function(){ return "func";};
	var func2 = function(){ return "func2"};
	var func3 = function(){ return "func3"};
	Interceptor.interceptPre(func, function(thisArg, targetFunc, argList){
		if(thisArg === obj){
			this.returnValue("");
		}
	});

	Interceptor.interceptPre(func3, function(thisArg, targetFunc, argList){
		if(thisArg === obj){
			this.returnValue("3cnuf");
		}
	});

	a.equals("func", func());

	a.equals("func", func.call());
	a.equals("func", func.apply());

	a.equals("", func.call(obj));
	a.equals("", func.apply(obj));

	a.equals("func2", func2());
	
	a.equals("func2", func2.call());
	a.equals("func2", func2.apply());

	a.equals("func2", func2.call(obj));
	a.equals("func2", func2.apply(obj));

	a.equals("func3", func3());
	
	a.equals("func3", func3.call());
	a.equals("func3", func3.apply());

	a.equals("3cnuf", func3.call(obj));
	a.equals("3cnuf", func3.apply(obj));
};

test.afterAll = function(){
	Interceptor.end();
}