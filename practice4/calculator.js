/* 

	data structure: 
		1. data[] 存輸入, 以及最後轉換成string顯示
		2. operator[], 檢查是 ＋ − × ÷ C AC +/- 哪一個
		   如果是 . 跟 % 就另外處理
		3. 
	
	function: 
		1. 處理 mouse event, 根據哪一個 btn 被按下, 對 data[] 作處理
		2. 顯示 data[] 在 #display 的div 裡面
		   1. 實作 stack
		   2. Infix to Postfix
		   3. Evaluating Postfix
		   4. display

	=========

	進階：
	做一個 繁體中文 的 calculator, 想想看怎麼轉換最快


	=========
	
	利用 querySelector() 去找 element ( check p.246 )
		先找 span
		再確認 有沒有 className, 沒有的話是一般數字, 有的話是效果器

	operator 無法用 string 轉成 number 的方式做, 要在 function 裡面分 case 處理


	=====   問題欄  ======

	1. html 還沒有 loaded 完畢, 會出現 .getElementById() 回傳 null 的情形
	   -> 建立一個 if() 確認 var 是否有值, 如果有, 才進行 addEventListener()
	   -> 這是因為我把 <script></script> 放在 <head>裡面, 但是html元素要在<body>才會loaded
	   -> 所以如果把 <script>移到<body>裡面的最下方, 就沒問題了

	2. event.target!!!!!!!!!!
	   -> 解決：addEventListener()中, 不能用 btns[i] 這樣的 variable
	           因為當 event handler 的for loop跑完之後, 
	           btns[i] 就會變成 undefined, 因為 i++ 會使 i 超過 btns[] 的範圍
	           所以在 addEventListener() 無法找到  btns[i].textContent

	           解決的辦法就是用  event.target!!!!  這就是「被click」的那個element!
	           所以可以用 event.target.textContent !!
	3. 小細節：使用.querySelectorAll("div.row span") 要取 tag+class時, 兩者之間不能有空白
	   -> 正確： div.row
	      錯誤： div .row

	4. 特別問題： 如果第一個輸入的是 - , 那麼在 parsing 後, infixExpress[0] 會是 ""
	   不過 Number("") == 0, 所以應該不會有問題, 之後再測試 

*/



// var btns = document.querySelectorAll("div.row span");
// var i = 1;

// if(btns){  // 保險起見, 還是加入這個 if()
// 	btns[i].addEventListener("click", function(){
// 		// if (btns[i].textContent == "AC"){
// 			console.log("I clicked "+ btns[i].textContent);
// 		// }
// 	});
// }


// var ArithmeticOperation = function(data){
// 	if (data == "AC"){
// 		console.log("I clicked "+ data);
// 	}
// };
// if(btns){  // 保險起見, 還是加入這個 if()
// 	btns[i].addEventListener("click", ArithmeticOperation(btns[i].childNodes[0].data));
// }

// =========

// data structure

var current = "";
var display = [];
var infixExpress = [];
var postfixExpress = [];
var operators = ["+", "-", "×", "÷", "=", "AC", "DEL", "+/-"];
var numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
var isThereDot = false;

function IsNumber(symbol){
	return (numbers.indexOf(symbol) != -1);
}

function IsOperator(symbol){
	if(operators.indexOf(symbol) != -1){
		return true;
	}
	else{
		return false;
	}
}

function IsNotFloatNum(symbol){
	symbol = Number(symbol);
	return ((symbol - Math.floor(symbol)) == 0) ;
}

/*
    幫每個按鈕加上 event handler, 處理 event: click 
    function 要處理很多東西, 或是取出來之後, 先占存在某個 variable
    再拿來和 array[] 比較, 判斷是否要放進array
    這樣比較合理, 因為 btn:1 不需要處理 btn:+ 的事
*/
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
    把資料放進 display[]
    當按下 = 之後, 再轉成 infixExpress[]
*/

function ResponseToClick(current){
	if(display.length > 0){    // 不是empty
		if(current === "+/-"){
			// 限定只有 display 只有一個有意義的數字元素(並且該元素不為0)的時候可以用
			// 先做一次parsing
			ParsingToInfix();      
			if(infixExpress.length == 1 && infixExpress[0] != (0 || "-")){
				// 這裡不能把 display[] 更新成 parsing 後的結果, 
				// 因為 DEL 還是必須對array的entry做pop()
				if(Number(infixExpress[0]) < 0){
					display.shift();       // 移除開頭的 -
				}
				else{
					display.unshift('-');  // 在開頭加入 - 
				}
			}
		}
		else if(current === "×" || current === "+" || current === "÷"){  
			if(IsOperator(display[display.length-1])){      // 這個條件式應該可以只保留第一項, 再檢查
				// 如果前一個是 operator, 先把前一個丟掉, 更新成最新按的
				// 但如果前一個是 = , 就不用清除
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
			// 每按一次 = , infixExpress 就要reset一次, 有可能使用者試用 DEL 讓 display[] 清空
			
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
		// 2. 然後看最後一個element, 如果不是數字就加
		// 3. 如果是 floating point, 就不能加, 如果不是就可以加
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
		if((operators.indexOf(display[i]) != -1) && (i != 0)){
			// 如果第一個是 - 就不做parsing, 把 - 跟後面的 digit 放在一起
			var str = "";
			for(var j = front; j < i; j++){
				str += display[j];
			}
			infixExpress.push(str);
			infixExpress.push(display[i]);
			front = i+1;
			str = "";
		}
	}
	// 再把剩下的加入 infixExpress
	for(var j = front; j < i; j++){
		var str = "";
		for(var j = front; j < i; j++){
			str += display[j];
		}
		infixExpress.push(str);
	}

	// console.log("infixExpress conversion done.");
	// console.log("infixExpress: "+infixExpress);
}

/*
	Display result
	取得 DOM 元素, assgin display 到該DOM元素的 textContent 裡面
	或是 innerHTML, 再研究
*/

function DisplayResult(){
	var result = document.querySelector("#display");
	result.textContent = display.join("");
	console.log("display: "+display);
}

/*   下面開始是按下 = 之後的字串處理以及計算結果   */ 

/*
   做一個 Stack 的 prototype

*/

function Stack(){        // constructor

	this.array = [];     // array[]用來存放資料

	// 因為 array 自己帶的 method 以及 property 太強大了, 不需要 front 也不需要 capacity
	// javascript 不需要做 capacity doubling, 語言本身已經在array.push()處理好了
	// method 在外面定義
}

Stack.prototype.isEmpty = function() {
	// if(this.array.length === 0){
	// 	return true;
	// }
	// else{
	// 	return false;
	// }
	// 上面六行等價於下面一行
	return (this.array.length === 0);
};

Stack.prototype.push = function(data) {
	this.array.push(data);
};

Stack.prototype.top = function() {
	if(!this.isEmpty()){               // 在prototype中, method之間若要互相呼叫, 也要加上"this."
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
	// 不做 isEmpty() 的條件判斷也可以, array.pop() 有 exception handling
};

Stack.prototype.display = function(){
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


/*
	Infix to Postfix Conversion
	Q: 如何處理 operator 之間的 priority
  
*/

var priorityOfOperators = {
	// "+/-": 1,
	"×" : 2,
	"÷" : 2,
	"+": 3,
	"-": 3
};

function InfixToPostfixConversion(){
	postfixExpress = [];      // 把 postfixExpress reset
	var stack = new Stack();
	for(var i = 0; i < infixExpress.length; i++){
		if(!IsOperator(infixExpress[i])){
			postfixExpress.push(infixExpress[i]);
		}
		else{
			// 有可能 stack 裡面有 '-','/', 此時如果要放入 '+', 應該要把兩個都吐出來, 再放入'+'
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
	// console.log("postfixExpress conversion done.");
	// console.log("postfixExpress: "+postfixExpress);
}

/*
	Evaluating Postfix & Operation of Each Operator

*/

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
		// console.log(stack.top());
	}

	// 這裡針對 javascript 本身的運算怪異做處理
	// test case: 9-2.001 會跑出 6.9990000000006 
	// 把後面拿掉

	// console.log("eveluating done.");
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


