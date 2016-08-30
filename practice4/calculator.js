/* 

	data structure: 
		1. display [] 存輸入, 以及最後轉換成string顯示
		2. infixExpress[] 和 postfixExpress[] 後處理用
		3. operator[], 檢查是 ＋ − × ÷ C AC +/- = 哪一個
	
	function: 
		1. 處理 mouse event, 根據哪一個 btn 被按下, 對 display [] 作處理
		2. 顯示 data[] 在 #display 的div 裡面
		   1. stack
		   2. Infix to Postfix
		   3. Evaluating Postfix
		   4. display

	待處理：
		- test case: 9-2.001 -> 6.9990000000006

*/


// data structure

var current = "";
var display = [];
var infixExpress = [];
var postfixExpress = [];
var operators = ["+", "-", "×", "÷", "=", "AC", "DEL", "+/-"];
var numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function IsNumber(symbol){
	return (numbers.indexOf(symbol) != -1);
}

function IsOperator(symbol){
	return (operators.indexOf(symbol) != -1);
}

function IsNotFloatNum(symbol){
	symbol = Number(symbol);
	return ((symbol - Math.floor(symbol)) == 0) ;
}

// add event handler

var rows = document.querySelectorAll("div.row");
for(var i = 0; i < rows.length; i++){
	var btns = rows[i].children;
	for(var j = 0; j < btns.length; j++){
		btns[j].addEventListener("click", function(event){
			current = event.target.textContent;   // 把東西存到 current 裡面
			ResponseToClick(current);
		});
	}
}


/*
	ResponseToClick() 對每個button做處理
    由button輸入時先存進display[], 當按下'='後再轉成infixExpress[]
    最後轉成postfixExpress[]做計算
*/

function ResponseToClick(current){
	if(display.length > 0){    // 不是empty
		if(current === "+/-"){
			// 限定只有 display 只有一個有意義的數字元素(並且該元素不為0)的時候可以用 +/-
			// 先做一次parsing, 利用infixExpress[]判斷目前在display的字串是否有意義
			ParsingToInfix();      
			if(infixExpress.length == 1 && infixExpress[0] != (0 || "-")){
				// 這裡不能把display[]更新成parsing後的結果,因為DEL還是必須對array的entry做pop()
				if(Number(infixExpress[0]) < 0){
					display.shift();       // 移除開頭的 -
				}
				else{
					display.unshift('-');  // 在開頭加入 - 
				}
			}
		}
		else if(current === "×" || current === "+" || current === "÷"){  
			if(IsOperator(display[display.length-1])){
				// 如果前一個是 operator, 先把前一個丟掉, 更新成最近按的
				display.pop();
			}
			display.push(current);
		}
		else if(current === "AC"){
			display = [];
			infixExpress = [];
		}
		else if(current === "DEL"){
			display.pop();
		}
		else if(current === "="){
			// 如果按 = 的時後, 結尾是 operator, 要先把它 pop() 掉
			if(IsOperator(display[display.length-1])){
				display.pop();
			}
			// 每按一次 =, infixExpress就要reset一次, 有可能使用者是用DEL讓display[]清空
			
			ParsingToInfix();            // 在這裏做 infixExpress = [];
			InfixToPostfixConversion();  // 在這裏做 postfixExpress = [];
			EvaluatingPostfix();
		}
	}
	// 這裡的 condition 不能用 if( 0 <= Number(current) <= 9){ }, 為什麼？
	if(IsNumber(current) || current === "00"){
		display.push(current);
	}
	else if(current === "." && display[display.length-1] !== "."){
		// 要控制, 不能在同一個 digit 有兩個 .
		// 1. 先 Parsing
		// 2. 看最後一個element, 如果是operators或者floating point就可以加
		ParsingToInfix(); 
		if(IsOperator(infixExpress[infixExpress.length-1]) 
			|| IsNotFloatNum(infixExpress[infixExpress.length-1]) ){
			display.push(current);
		}
	}
	else if(current === "-"){
		if(IsOperator(display[display.length-1])){   
		// 如果前一個是 operator, 先把前一個丟掉, 更新成最新按的
			display.pop();
		}
		display.push(current); 
	}
	
	// display
	DisplayResult();
}

function ParsingToInfix(){
	var front = 0;
	infixExpress = []; 
	for(var i = 0; i < display.length; i++){
		// 碰到operators時, 就把前面的全部數字轉成一個數字
		if((operators.indexOf(display[i]) != -1) && (i != 0)){
			// 如果第一個是 - 就不做parsing, 把 - 跟後面的 digit 放在一起
			var str = "";
			for(var j = front; j < i; j++){
				str += display[j];
			}
			infixExpress.push(str);			// i 之前是數字
			infixExpress.push(display[i]);	// i 是operator
			front = i+1;
		}
	}
	// 再把剩下的數字加入 infixExpress
	for(var j = front; j < i; j++){
		var str = "";
		for(var j = front; j < i; j++){
			str += display[j];
		}
		infixExpress.push(str);
	}
}

// Display result

function DisplayResult(){
	var result = document.querySelector("#display");
	result.textContent = display.join("");
}

/*   下面開始是按下 = 之後的字串處理以及計算結果   */ 

/*
   做一個 Stack 的 prototype
*/

function Stack(){        
	this.array = [];
}

Stack.prototype.isEmpty = function() {
	return (this.array.length === 0);
};

Stack.prototype.push = function(data) {
	this.array.push(data);
};

Stack.prototype.top = function() {
	if(!this.isEmpty()){               
		return this.array[this.array.length-1];
	}
	else{
		console.log("stack is empty.");
	}
};

Stack.prototype.pop = function() {
	if(!this.isEmpty()){
		this.array.pop();
	}
	else{
		console.log("stack is empty.");
	}
};

Stack.prototype.display = function(){		// check the state of stack
	if(!this.isEmpty()){
		this.array.forEach(function(entry){
			console.log(entry);
		});
	}
	else{
		console.log("stack is empty.");
	}
};

Stack.prototype.clear = function(){
	this.array = [];
};


// Infix to Postfix Conversion


var priorityOfOperators = {
	"×" : 1,
	"÷" : 1,
	"+": 2,
	"-": 2
};

function InfixToPostfixConversion(){
	postfixExpress = [];      // reset postfixExpress[] 
	var stack = new Stack();
	for(var i = 0; i < infixExpress.length; i++){
		if(!IsOperator(infixExpress[i])){
			postfixExpress.push(infixExpress[i]);
		}
		else{
			// 若 stack 裡面有 '-','÷', 此時如果要放入 '+'
			// 要把裡面兩個operator都pop()出來, 放進postfixExpress, 再將'+'放入stack
			while(!stack.isEmpty() && priorityOfOperators[infixExpress[i]] >= priorityOfOperators[stack.top()]){
				postfixExpress.push(stack.top());    // 先把優先權較高(數值較低)的symbol從stack拿出來
				stack.pop();
			}
			stack.push(infixExpress[i]);
		}
	}
	while(!stack.isEmpty()){
		postfixExpress.push(stack.top());
		stack.pop();
	}
}

// Evaluating Postfix & Operation of Each Operator

function ArithmeticOperation(symbol, arg1, arg2){
	switch(symbol){
		case("+"):{
			return (Number(arg1) + Number(arg2));
			break;
		}
		case("-"):{
			return (Number(arg1) - Number(arg2));
			break;
		}
		case("×"):{
			return (Number(arg1) * Number(arg2));
			break;
		}
		case("÷"):{
			return (Number(arg1) / Number(arg2));
			break;
		}
		default:{
			break;
		}
	}
}

function EvaluatingPostfix(){
	var stack = new Stack();
	for(var i = 0; i < postfixExpress.length; i++){
		if(!IsOperator(postfixExpress[i])){
			stack.push(postfixExpress[i]);
		}
		else{
			var arg2 = stack.top(); stack.pop();
			var arg1 = stack.top(); stack.pop();
			stack.push(ArithmeticOperation(postfixExpress[i], arg1, arg2));
		}
	}
	// 把最後結果按照 一個entry一個charactor 的規則放回 display[]
	var result = String(stack.top());
	display = [];
	for(var i = 0; i < result.length; i++){
		display.push(result[i]);
	}
	if(display[display.length-1] === "." ){      // 小處理, 如果最後一個是.結尾, 就把它丟掉
		display.pop();
	}
}


