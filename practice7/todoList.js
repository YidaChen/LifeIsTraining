
/*
	有些函式可以建成 TodoList 的 prototype.function(), 有些不適合

	目前簡單的區分是：
	-TodoList本身
	-DOM相關

*/

var title = document.querySelector('h2');
title.addEventListener('click', function(event){
	if(event.target.textContent == 'Todos'){
		event.target.textContent = 'or NotTodos';
	}
	else{
		event.target.textContent = 'Todos';
	}
});

/////////////////////////////////////////////
//
//    建立 TodoList 的 prototype
//
/////////////////////////////////////////////

// 每一個 array 的 entry 儲存的 element, 類似linked list的node
function TodoItem(todoText){    
	this.todoText = todoText;
	this.completed = false;
}

function TodoList(array){
	this.todoList = array;
}

/*
    display 很麻煩, 因為有三種情況: All, Active, Completed
    要怎麼分別產生不同的矩陣？
      1. todoMVC 是可以切換出不同的 url     
          .../#
          .../#/active
          .../#/completed
      2. 另一種辦法是內建三個 array, 每次delete, add, toggle 都要調整, 
      3. 第三種辦法是每次都跑一個 for loop, 然後產生一個暫時的 array 做display
           -> 這種辦法會一直 removeChild/appendChild, 不知道會不會很慢

      1 的方法留待日後學, 現在先用 2 或 3 嘗試, 總有辦法
*/
TodoList.prototype.displayTodo = function(){

	// 每次display前都先存一次 localStorage
	saveToStorage();
	// 先把 display區塊的DOM淨空	
	clearDisplayTodo(); 
	// 全部處理都有可能更改 todoItem.completed, 所以要確認 toggleAllButton 
	checkToggleAllandClearCompletedButton();
	// 修改還有幾個項目沒做完
	countItemsLeft();

	// 要有三種mode
	for(var i = 0; i < this.todoList.length; i++){
		console.log(this.todoList[i]);
		if(mode == 0){												// All
			addTodoInDOM(this.todoList[i]);
		}
		else if(mode == 1 && this.todoList[i].completed == false){	// Active
			addTodoInDOM(this.todoList[i]);
		}
		else if(mode == 2 && this.todoList[i].completed == true){	// Completed
			addTodoInDOM(this.todoList[i]);
		}
	}
};

TodoList.prototype.addTodo = function(todoText){
	// this.todoList.push({text:textTodo, completed: false});
	// debugger;
	this.todoList.push(new TodoItem(todoText));
	this.displayTodo();
};

TodoList.prototype.deleteTodo = function(index){
	this.todoList.splice(index, 1);
	this.displayTodo();
};

TodoList.prototype.clearCompletedTodo = function(){
	var i = 0;
	while(i < todoList.todoList.length){
		// 如果有刪除, 就不增加index, 因為array本身會被改變
		// [1,2,3,4] -> 刪除array[0]=1 -> [2,3,4], 就把index留在0, 接著檢查 2
		if(this.todoList[i].completed == true){
			this.deleteTodo(i);
		}
		else{
			i++;
		}
	}
	this.displayTodo();
}

TodoList.prototype.changeTodo = function(newText, index){
	this.todoList[index].todoText = newText;
	this.displayTodo();
};

TodoList.prototype.toggleCompleted = function(index){
	this.todoList[index].completed = !this.todoList[index].completed;
	this.displayTodo();
};

TodoList.prototype.toggleAll = function(){
	var length = this.todoList.length;
	// debugger;
	if(isAllToggleTrue()){    // 如果全部都是true, 全部設成false
		for(var i = 0; i < length; i++){
			this.todoList[i].completed = false;
		}
	}
	else {                    // 有一個false, 全部設成true
		for(var i = 0; i < length; i++){
			this.todoList[i].completed = true;
		}
	}
	this.displayTodo();
};

////////   TodoList 的 prototype 建立完畢   //////////



/////////////////////////////////////////////
//
//    Addressing DOM: add Event Handler
//
/////////////////////////////////////////////



////////////   把Header上看到的 button, inputBar 都加上 event handler  ////////////////

var inputBar = document.querySelector('#inputBar');
var toggleAllButton = document.querySelector('#toggleAll');
var clearCompletedButton = document.querySelector('#clearCompleted');


/*  從inputBar讀到新的todo, 加入 todoList裡面  */
inputBar.addEventListener('keydown', function(event){
	// 按Enter鍵(keyCode:13)會輸入, 而且string不是空白才輸入
	if ((event.keyCode == 13) && (inputBar.value) !== '') {				
		todoList.addTodo(inputBar.value);	// inputBar.value就是輸入 string
		inputBar.value = '';				// 輸入完後, 把inputBar更新成空白
	}
});
toggleAllButton.addEventListener('click', function(event){
	todoList.toggleAll();
});
clearCompletedButton.addEventListener('click', function(event){
	todoList.clearCompletedTodo();
});

function countItemsLeft(){
	var itemLeft = document.querySelector('#itemLeft');

	var count = 0,
	    length = todoList.todoList.length;
    for(var i = 0; i < length; i++){
		if(todoList.todoList[i].completed === false){
			count++;
		}
	}
	itemLeft.textContent = count+' items left';
}

///////   下面三個是 toogleAll 和 clearCompleted 專用    /////////

function isAllToggleTrue(){
	var count = 0,
	    length = todoList.todoList.length;
	for(var i = 0; i < length; i++){
		if(todoList.todoList[i].completed === true){
			count++;
		}
	}
	return (count === length);
}

function isOneToggleCompleted(){
	var length = todoList.todoList.length;
	for(var i = 0; i < length; i++){
		if(todoList.todoList[i].completed === true){
			return true;
		}
	}
	return false;
}

function checkToggleAllandClearCompletedButton(){
	if(todoList.todoList.length == 0 || !isAllToggleTrue()){
		toggleAllButton.textContent = '';
	}
	else{
		toggleAllButton.textContent = '\u267B';	
	}

	if(isOneToggleCompleted()){
		clearCompletedButton.style.display = 'block';
	}
	else{
		clearCompletedButton.style.display = 'none';
	}
}



/*  
	產生 todoItem aka a <li> element, 每一個 <li> 裡面有三個 childNodes
	這裡面就要安裝好 event handler  
*/

function addTodoInDOM(newTodo){
	var newTodoItemLi = document.createElement('li');
	var unOrderList = document.querySelector('ul');

	// children#1: checkbox for toggleCompleted
	var toggleCheckbox = document.createElement('div');
	toggleCheckbox.className = 'checkbox';
	if(newTodo.completed === true){              // 這裡改變 div 的 textContent 成
		toggleCheckbox.textContent = '\u267B';   // 資源回收的圖案：UNICODE: U+0267B
	}
	else{
		toggleCheckbox.textContent = '';
	}

	toggleCheckbox.addEventListener('click', function(event){
		var index = indexOfCurrentTodo(event.target);
		todoList.toggleCompleted(index);
	});


	// children#2: todoText, changeTodo
	var todoText = document.createElement('div');
	todoText.className = 'todoItem';
	todoText.textContent = newTodo.todoText;
	if(newTodo.completed === true){				// 這個是把 completed 的項目加上橫線槓掉
		todoText.style.textDecoration = 'line-through';	// 與 toggleChechbox 同步
	}
	todoText.addEventListener('dblclick', function(event){
		var index = indexOfCurrentTodo(event.target);
		var editTodoText = editTodoByDoubleClick(event.target, index);		
	});


	// children#3: delete button
	var deleteButton = document.createElement('div');
	deleteButton.className = 'deleteBtn';
	deleteButton.textContent = '\u271E';					// cross
	deleteButton.addEventListener('click', function(event){
		var index = indexOfCurrentTodo(event.target);
		todoList.deleteTodo(index);
	});

	// 把新增的 Node 加進 DOM
	newTodoItemLi.appendChild(toggleCheckbox);
	newTodoItemLi.appendChild(todoText);
	newTodoItemLi.appendChild(deleteButton);

	unOrderList.appendChild(newTodoItemLi);
}

//////    每一次 displayTodo() 之前都先把DOM的display部分清空    //////

function clearDisplayTodo(){
	var unOrderList = document.querySelector('ul');
	while(unOrderList.children.length != 0){
		unOrderList.removeChild(unOrderList.children[0]);
	}
}


/////////////////////////////////////////////////////////////
//
//          重要：double click 之後產生一個 input form, 
//          讓使用者輸入新的字串, 再變回原來的div
//
/////////////////////////////////////////////////////////////

/*
	Normal flow is this. User clicks text on web page. 
	Block of text becomes a form. 
	User edits contents and presses submit button. 
	New text is sent to webserver and saved. 
	Form becomes normal text again.
*/

function editTodoByDoubleClick(element, index){
	// 要產生一個 input form 才能讓使用者輸入字串, 幫新的 input 加裝 event handler
	// 之後再和 <li> 裡面已經存在的 div:todoItem 對調
	// 當 edit 的字串輸入完, 就存進 object:todoList 裡面
	// 等到 displayTodo() 時會把 DOM 中display區塊全部清除, 所以這個input form也就清除了

	var editArea = document.createElement('input');
	// 設定 input 的 style
	editArea.classList.add('editInput');			
	// 把原先的 todoText 設為 input form 一開始的字串
	editArea.value = todoList.todoList[index].todoText;
	/* 
		下面這個「幫editArea加上 property: index」 非常重要
		不然沒有辦法在 callChangeTodo() 裡面得知 index 是什麼
		要建立 callChangeTodo() 的原因是
		    要在 event: keydown 的handler 裡面把 event:blur 的handler移除
		    否則會有 error (看下面的註解)
		而 revomeEventListener(event, functionName) 的需要知道 function 的 name
		所以就建立 callChangeTodo()

		Ref: http://stackoverflow.com/a/11986895/5391038
	*/
	editArea.index = index;

	/* 
		下面對 editArea 建立兩個「輸入修改後的todoText」的event handler
		目的是讓使用者以較為直覺的方式進行修改
		不管是 滑鼠移開(focus狀態解除) 或是 按下Enter 都可以完成 edit
	*/ 

	function changeTodoOrDeleteTodo(event){
		if(event.target.value == ''){			
			// 如果edit的input裡最後是空白, 就刪除該todoItem
			todoList.deleteTodo(event.target.index);
		}
		else{
			todoList.changeTodo(event.target.value, event.target.index);
		}
	}
	editArea.addEventListener('blur', changeTodoOrDeleteTodo);
	editArea.addEventListener('keydown', function(event){   
		if ((event.keyCode == 13)) {	// keyCode:13 = Enter鍵
			/*  
				要先移除 event:blur 的handler, 再進行 todoList.changeTodo()
				因為 .changeTodo() 裡面會有 .displayTodo(), 會要對DOM做動作
				如果不先移除blur的event handler, 就會產生下面的error:

				Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node' 
				The node to be removed is no longer a child of this node. 
				Perhaps it was moved in a 'blur' event handler?
			*/
			editArea.removeEventListener('blur', changeTodoOrDeleteTodo);
			changeTodoOrDeleteTodo(event);
		}
	});
	// 這裡把 editArea(input) 和原來的 todoItem(div) 對調, 放進 DOM
	element.parentNode.replaceChild(editArea, element.parentNode.children[1]);
	// 當 .replaceChild() 執行完畢, 也就是把 editArea 放進DOM之後, 才可以對 editArea 進行 focus
	editArea.focus();		// .focus() 之後就會出現滑鼠 cursor	
}




/* 
	如何從 deleteButton, toggleCompleted 取得 目前是在第幾個 <li> element
     -> 試試看 用 <li> 中的 todoText 和 todoList.todoList[]比較, 找出 index
*/

function indexOfCurrentTodo(element){   // element = li 的三個childNode
	// 找到 deleteBtn 所在的 li 的text, 拿去和 todoList的array比較, 找出該text的index
	// element.parentNode 就是 li
	var todoTextOfCurrentLi = element.parentNode.children[1].textContent; // .children[]才不會有textNode攪局
	// debugger;
	for(var i = 0, length = todoList.todoList.length; i < length; i++){
		if(todoTextOfCurrentLi === todoList.todoList[i].todoText){
			return i;
		}
	}
}


//////    處理 display 的三個mode: All Active Completed     //////

var mode = 0;    // 0: All, 1: Active, 2: Completed
var allButton = document.querySelector('#All');
var activeButton = document.querySelector('#Active');
var completedButton = document.querySelector('#Completed');

allButton.addEventListener('click', function(event){
	mode = 0;							// 更改 mode, 會在 displayTodo() 用到
	clearActiveClass();					// 先清空 All, Active, Completed 的 class
	allButton.classList.add('active');  // 再將class:active加入現在被點到的 allButton
	todoList.displayTodo();				// 顯示 displayTodo()
});
activeButton.addEventListener('click', function(event){
	mode = 1;
	clearActiveClass();
	activeButton.classList.add('active');
	todoList.displayTodo();
});
completedButton.addEventListener('click', function(event){
	mode = 2;
	clearActiveClass();
	completedButton.classList.add('active');
	todoList.displayTodo();
});

function clearActiveClass(){
	var modeButtons = document.querySelectorAll('.filterBtn');	// 把三個button放進一個array
	Array.prototype.forEach.call(modeButtons, function(btn){
		btn.classList.remove('active');
	});
}



// 在 event: load 觸發時, 要判斷localStorage裡面有沒有東西, 如果沒有, 建新的, 如果有, 用舊的

var todoList;     // 把 object: todoList 設成 global variable, 會比較簡單

window.addEventListener('load', function(event){
	// debugger;
	if(localStorage.length == 0){		// 如果 localStorage 沒東西, new 新的 Todolist
		todoList = new TodoList([]);	// 這裡的arg很重要, 要放 ([]) 表示type是array
	}									// 不能放 ('') 或是空白()
	else{
		loadFromStorage();
	}
	todoList.displayTodo();
});


////////////  做 localStorage  /////////////

function saveToStorage(){
	// 把整個 object 放進去, 不是只有放 array
	// 所以在 loadFromStorage() 的時候要取array, 不能整個 object 拿去 new TodoList
	localStorage.setItem('todoList', JSON.stringify(todoList)); 
	// 幾乎每一個動作都會更改 todoList.todoList[], 
	// 所以在 displayTodo() 裡面執行 saveToStorage()
}
function loadFromStorage(){
	// 目前看起來, localStorage 沒有辦法連 object 的 method/ prototype 一起存
	// 所以每次 load 都要 先取出上次存入的 todoList(整個object)
	// 再把 object 裡面的 array 取出來
	// 然後以array作為arg, 創造新的todoList object, new TodoList( arg )

	var todoObject = JSON.parse(localStorage.getItem('todoList'));
	todoList = new TodoList(todoObject.todoList);
}





/* 最後改style時再用下面這三個debug */

// addNewTodoInDOM('發現，已經失去最重要，的東西。恍然大悟早已遠去，為何總是在犯錯之後才肯相信，錯的是自己。');
// addNewTodoInDOM('他們說這就是人生，試著體會。');
// addNewTodoInDOM('試著忍住眼淚，還是躲不開應該有的情緒。');
