




	
var table = document.querySelector('.displayTable'); // table 的 children 抓幾個row
var vertices, verticesCell;
var schedule;	// 之後要換成 load event 處理 localStorage
var whoIsOnFocus;
var imagRect, startPosition;

////////////////////////////////////////
//
//			Imaginary Rectangle
//
////////////////////////////////////////

function generateImagRect(event){
	// 這裡要做 if-else 判斷 event 如果是 滑鼠左鍵才會產生 imagRect
	// 如果event不是觸發在 displayCol 上也不產生 imagRect
	// 這樣 console, input, div 上都可以進行自己的event handling
	if(event.target.className == 'displayCol' && event.which == 1){
		imagRect = createElementWithClass('div', 'imagRect');

		// startPosition 要扣掉 offsetOfTable, 因為現在把 imagRect 當成 table 的 child
		// 所以要扣掉 table 在 body 裡面的offset, 才可以跟 table 的 左上角參考點同步
		// 這裡扣掉之後, inWhichCell() 的 arg就不用扣了
		// 更理想的應該是把offset設成 startPosition 的property
		// 不過應該沒有人會一邊拉imagRect一邊調整browser大小
		startPosition = getPositionWithOffsetFromTable(event);
		
		setRectLeftTop(imagRect, startPosition.x, startPosition.y);
		setRectWidthHeight(imagRect, 0, 0);		// 這裡先 assign 一次, 才可以把 滑鼠不小心click的點刪掉
												// 否則抓不到 .style.width/height 這兩個property
		addEventListener('mousemove', rectSpanning);
		event.preventDefault();		// prevent selection

		table.appendChild(imagRect);	// 這裡要加在table上,如果加在body上, 調整browser大小時, imagRect就會跑掉
	}
}
function rectSpanning(event){		// handler of event: mousemove
	if(!(event.buttons && event.which)){			// 如果 mousemove 結束
		removeEventListener('move', rectSpanning);
	}
	else{
		if(imagRect){
			var endPosition = getPositionWithOffsetFromTable(event);
			var newWidth = Math.abs(endPosition.x - startPosition.x),
				newHeight = Math.abs(endPosition.y - startPosition.y);
			// 滑鼠往左和往上時, imagRect 的 top 和 left 需要修改
			if((endPosition.x - startPosition.x) < 0){
				// 這裡不能用 imagRect.style.left -= newWidth; 
				// 因為imagRect.style.left 一直在變, 要用 startPosition.x
				imagRect.style.left = (startPosition.x - newWidth) + 'px';
			}
			if((endPosition.y - startPosition.y) < 0){
				imagRect.style.top = (startPosition.y - newHeight) + 'px';
			}
			setRectWidthHeight(imagRect, newWidth, newHeight);

			// 在修改完 imagRect 的邊緣之後, 可以用 imagRect 的四個頂點的位置來蒐集所有被 imagRect 橫越的 cell
			updateVerticesOfImagRect(newWidth, newHeight);
		}
	}
}
function clearImagRect(){
	var imagRects = document.querySelectorAll('.imagRect');
	[].forEach.call(imagRects, function(rect){
		table.removeChild(rect);
	});	
	imagRect = undefined;
}
addEventListener('mousedown', generateImagRect);
addEventListener('mouseup', function(event){
	// 保險起見, 清除所有 imagRect
	clearImagRect()

	// 下面最外圍的 if-else 是處理 imagRect 如果「最後」並沒有落在 table 裡面, 就不產生 input
	// 在 mousemove結束後執行過updateVerticesOfImagRect()
	// 這裡要再判斷最後的imagRect是因為, 有可能在「拉imagRect」的時候有「掠過cell」, 但最後並沒有涵蓋cell
	// 需要把這種情況考慮進去, 不然會有不應該出現的 input 跑進 table 裡面

	if( (verticesCell == undefined) || 		// 用 verticesCell來判斷目前有沒有「有效的imagRect」
		(isThereDivAlreadyOnCell() || 	// 這裡要處理：「如果 imagRect 有橫越過已經存在的 div，就不能產生新的div」
		 vertices.bottomright.left < widthRangeOfCell[0] || vertices.topleft.left > widthRangeOfCell[7] ||
		 vertices.bottomright.top < heightRangeOfCell[0] || vertices.topleft.top > heightRangeOfCell[16])){
		console.log('cannot generate input here.');
	}
	else {
		var cellTopLeft = verticesCell.topleft, 
			cellBottomRight = verticesCell.bottomright;
		var inputDiv = createElementWithClass('textarea','inputDiv');
		inputDiv.id = generateID();
		inputDiv.rowFrom = cellTopLeft.row;
		inputDiv.rowTo = cellBottomRight.row;
		inputDiv.colFrom = cellTopLeft.col;
		inputDiv.colTo = cellBottomRight.col;

		// 利用 flag 記錄 「哪幾個cell已經有div」
		toggleInvolvedCell(inputDiv.rowFrom, inputDiv.rowTo, inputDiv.colFrom, inputDiv.colTo);

		// 有了四個頂點所在的cell之後, 可以計算最外圍cell的總width/height/top/left
		// 有預留 border 和 padding 2*X 2*Y, 又因為 browser 縮放的時候, padding 不會動, border會被改變
		// 所以放padding就好, 這樣算出來才會精確
		setRectLeftTop(inputDiv, cellTopLeft.element.offsetLeft, cellTopLeft.element.offsetTop);
		setRectWidthHeight( inputDiv, 
							(widthRangeOfCell[cellBottomRight.col]-widthRangeOfCell[cellTopLeft.col-1] -2*0 -2*5), 
							(heightRangeOfCell[cellBottomRight.row]-heightRangeOfCell[cellTopLeft.row-1] -2*0 -2*5));

		inputDiv.addEventListener('focus', setElementOnFocus);
		inputDiv.addEventListener('keydown', handleKeyDown);
		// 這裡不能設 event: blur 的handler, 否則一按到 color button 就會觸發 blur
		// 就進行 storeInputGenerateDiv, 便無法調整 color

		table.appendChild(inputDiv);
		inputDiv.focus();
	}
});

///////////////////////////////////////////////////
//
// 		flagForItemOnCell 是用來判斷 cell 上面是否已經有 input/div, 
// 		如果有的話, imagRect 就不能在其上產生新的 input/div
//
///////////////////////////////////////////////////

var flagForItemOnCell = [];
createAndInitializeFlag();
function createAndInitializeFlag(){
	flagForItemOnCell = new Array(17);
	for(var i = 0; i < 17; i++){
		flagForItemOnCell[i] = new Array(8);
		for(var j = 0; j < 8; j++){
			if(i == 0 || j == 0){
				flagForItemOnCell[i][j] = true;	
			}
			else{
				flagForItemOnCell[i][j] = false;
			}
		}
	}
	// 順便把 col:time 跟 row:week 都設為 true 
}
function toggleFlag(row,col){
	flagForItemOnCell[row][col] = !flagForItemOnCell[row][col];
}
function isThereDivAlreadyOnCell(){
	for(var i = verticesCell.topleft.row; i <= verticesCell.bottomright.row; i++){
		for(var j = verticesCell.topleft.col; j <= verticesCell.bottomright.col; j++){
			if(flagForItemOnCell[i][j] == true){
				return true;
			}
		}
	}
	return false;
}
function toggleInvolvedCell(rowFrom, rowTo, colFrom, colTo){
	for(var i = rowFrom; i <= rowTo; i++){
		for(var j = colFrom; j <= colTo; j++){
			// debugger;
			toggleFlag(i,j);
		}
	}
	// delete & toggle
}

////////////////////////////////////////
//
//			Constructor
//
////////////////////////////////////////


function Vector(left,top){		// 可能可以不用用到 prototype, 用普通function即可
	this.left = left;
	this.top = top;
}
function Schedule(scheduleObject){
	this.array = scheduleObject.array || [];
	this.title = scheduleObject.title || '';
	this.subtitle = scheduleObject.subtitle || '';
	this.startTime = scheduleObject.startTime || undefined;
}
function Item(element){
	this.id     = element.id;
	this.text   = element.value;	// 原封不動放進 .innerText 就可以換行, .value 裡面已經有 /n
	this.width  = element.style.width;
	this.height = element.style.height;
	this.left   = element.style.left;
	this.top    = element.style.top;
	this.fontColor  = element.style.color;
	this.backgroundColor = element.style.backgroundColor;
	this.rowFrom = element.rowFrom;
	this.rowTo = element.rowTo;
	this.colFrom = element.colFrom;
	this.colTo = element.colTo;
}


////////////////////////////////////////
//
//			Create DOM Nodes
//
////////////////////////////////////////


function generateID(){
	var dt = new Date();
	return (dt.getTime());
}
function createElementWithClass(tagName,className){
	var element = document.createElement(tagName);
	if(className){
		element.className = className;
	}
	return element;
}
function createElementWithID(tagName,id){
	var element = document.createElement(tagName);
	if(id){
		element.id = id;
	}
	return element;
}
function createElementWithItem(tagName,className,arrayItem){
	var element = document.createElement(tagName);
	element.className = className;

	element.id = arrayItem.id;
	element.style.width = arrayItem.width;
	element.style.height = arrayItem.height;
	element.style.left = arrayItem.left;
	element.style.top = arrayItem.top;
	element.style.backgroundColor = arrayItem.backgroundColor;
	element.rowFrom = arrayItem.rowFrom;
	element.rowTo = arrayItem.rowTo;
	element.colFrom = arrayItem.colFrom;
	element.colTo = arrayItem.colTo;
	
	if(className == 'finalDiv'){
		// 為了讓 text 能夠垂直置中, 需要外面的div是display:table, 
		// 文字的部分再用一個display:table-cell做置中
		var finalDivText = createElementWithClass('div','finalDivText');
		finalDivText.style.color = arrayItem.fontColor;	// fontColor是要給display:table-cell的div
		finalDivText.innerText = arrayItem.text;		// 這裡放進innerText, 就可以換行了！
		element.appendChild(finalDivText);
	}
	else{
		element.value = arrayItem.text;		// 這是給inputDiv用的, 因為是textarea, 用value
		element.style.color = arrayItem.fontColor;
	}
	return element;
}

function idxInArray(elementID){
	for(var i = 0; i < schedule.array.length; i++){
		if(elementID == schedule.array[i].id){
			return i;
		}
	}
	// exception handling
	return -1;
}

/////////////////////////////////////////////////////////
//
//	Callback Functions for Event Handlers of input/div
//
/////////////////////////////////////////////////////////

function setElementOnFocus(event){
	whoIsOnFocus = event.target;
}

function handleKeyDown(event){
	if(event.keyCode == 13 && !event.shiftKey){
		if(event.target.value == ''){
			deleteElement(event.target);
		}
		else{
			storeInputGenerateDiv(event.target);
		}
	}
	else if(event.keyCode == 46){		// keyCode:46 -> delete
		deleteElement(event.target);
	}
}

function storeInputGenerateDiv(target){
	
	// 每次都刪除之前存在 schedule.array 裡的item,這樣可以卻把所有變動(text, color)都能被更新
	if(idxInArray(target.id) != -1){		
		schedule.array.splice(idxInArray(target.id), 1);
	}
	schedule.array.push(new Item(target));
	saveToStorage();

	var idx = idxInArray(target.id);
	// debugger;	
	var finalDiv = createElementWithItem('div','finalDiv', schedule.array[idx]);
	finalDiv.children[0].addEventListener('click', clickToEditForDiv);
	table.replaceChild(finalDiv, target);

	// bug: 不知道為何無法使用dbclick, 若使用 dbclick, window上的mousemove會優先跑出來
	// 在 addEventListener(arg1,arg2,arg3) 的 arg3 加入 true/false 可能結果不同, 待測試
}

function clickToEditForDiv(event){
	// 這裡的 event.target 是 finalDivText, 所以做 replaceChild 的時候
	// 要跟 event.target.parentNode 換
	
	var idx = idxInArray(event.target.parentNode.id);
	var inputDiv = createElementWithItem('textarea','inputDiv', schedule.array[idx]);
	inputDiv.addEventListener('focus', setElementOnFocus);
	inputDiv.addEventListener('keydown', handleKeyDown);
	// inputDiv.addEventListener('blur', storeInputGenerateDiv);  // 這不能用

	table.replaceChild(inputDiv, event.target.parentNode);
	inputDiv.focus();
}


///////////////////////////////////////////////////
//
//		  console 上的 buttons   
//
///////////////////////////////////////////////////

var chromeSpan = document.querySelector('#chrome');
var firefoxSpan = document.querySelector('#firefox');
chromeSpan.addEventListener('mouseover', function(event){
	event.target.textContent = '\u263A';
	event.target.style.fontSize = '16px';
	event.target.style.color = '#176dae';
});
chromeSpan.addEventListener('mouseout', function(event){
	event.target.textContent = 'Chrome';
	event.target.style.fontSize = '14px';
	event.target.style.color = '#1e1e28';
});
firefoxSpan.addEventListener('mouseover', function(event){
	event.target.textContent = '\u2639';
	event.target.style.fontSize = '16px';
	event.target.style.color = '#dd6e6e';
});
firefoxSpan.addEventListener('mouseout', function(event){
	event.target.textContent = 'Firefox';
	event.target.style.fontSize = '14px';
	event.target.style.color = '#1e1e28';
});

var consoleBar = document.querySelector('#console');
var printButton = document.querySelector('#printButton');
printButton.addEventListener('click', function(){
	hideConsolrBar();
	window.print();
	showConsoleBar();
});

function hideConsolrBar(){
	consoleBar.style.display = 'none';
	// 使用前要重抓一次title, 有可能先前有修改title, 經過替換成input再換回div, 已經是不同個title
	title = document.querySelector('#title');
	title.style.marginTop = '20px';
}
function showConsoleBar(){
	consoleBar.style.display = 'block';
	title = document.querySelector('#title');
	title.style.marginTop = '80px';
}

var bgColorButton = document.querySelector('#backgroundColor');
bgColorButton.addEventListener('change', function(event){
	// debugger;
	if(whoIsOnFocus){
		whoIsOnFocus.style.backgroundColor = event.target.value;
		whoIsOnFocus.focus();		// 讓滑鼠回到正在編輯的 input 那裡
	}
});

var fontColorButton = document.querySelector('#fontColor');
fontColorButton.addEventListener('change', function(event){
	if(whoIsOnFocus){
		whoIsOnFocus.style.color = event.target.value;
		whoIsOnFocus.focus();
	}
});

var deleteButton = document.querySelector('#deleteButton');
deleteButton.addEventListener('click', function(event){
	if(whoIsOnFocus){
		deleteElement(whoIsOnFocus);
	}
});

function deleteElement(toBeDeleted){

	// 把variable reset
	verticesCell = undefined;  // 防止沒有imagRect產生, 還是會觸發mouseup中產生inpuDiv的機制
	whoIsOnFocus = undefined;  // 防止div已經刪除, 但是whoIsOnFocus還是可以進入deleteButton

	table.removeChild(toBeDeleted);
	// 修改 cell 的 flag, 如果用 inWhichCell() 來做會有bug, 因為 item.top + item.height 不會吻合 cell的長寬
	toggleInvolvedCell(toBeDeleted.rowFrom, toBeDeleted.rowTo, toBeDeleted.colFrom, toBeDeleted.colTo);
	if(idxInArray(toBeDeleted.id) != -1){
		var idx = idxInArray(toBeDeleted.id);
		var item = schedule.array[idx]; 
		// 移除localStorage
		schedule.array.splice(idx,1);
		saveToStorage();
	}
}


///////////////////////////////////////////////////
//
//		時間刻度 的 button
//
///////////////////////////////////////////////////

var upButton = document.querySelector('#up');
var downButton = document.querySelector('#down');

upButton.addEventListener('click', adjustTimeScale);
downButton.addEventListener('click', adjustTimeScale);

function adjustTimeScale(event){
	var timeScales = document.querySelectorAll('.time span');
	
	var startTime = parseInt(timeScales[2].textContent);
	displayTimeScale(timeScales, startTime, event.target.id);

	// 記下第一個timeScale, 存進localStorage 
	schedule.startTime = parseInt(timeScales[2].textContent);
	saveToStorage();
}

function displayTimeScale(timeScales, startTime, targetID){
	// 前兩個是up/down buttons
	for(var i = 2, length = timeScales.length; i < length; i = i + 2 ){
		if(targetID == 'down'){
			timeScales[i].textContent = (++startTime)%24;	// 先++再assign
			timeScales[i+1].textContent = (startTime+1)%24;
		}
		else{
			timeScales[i].textContent = (startTime-1+24)%24;
			timeScales[i+1].textContent = (startTime+24)%24;
			startTime++;
		}
	}
}

///////////////////////////////////////////////////
//
//		所有關於 position 和 width/height
//		建立 array 記錄 cell 的位置
//			-> 需要扣掉 offsetLeft, 因為 client 端的 browser 不同
//		並利用 binary search 確認「目前滑鼠移動到哪一個cell」
//
///////////////////////////////////////////////////


var widthRangeOfCell = [], heightRangeOfCell = [];

function formMapOfRange(){
	// 每次取的時候都要重新抓一次 widthRangeOfCell 和 heightRangeOfCell
	// 有可能會有 browser 縮放, 不能保證client端一直維持 100% 比例

	// var table = document.querySelector('.displayTable'); // table 已經設為 global variable
	var row = document.querySelector('.displayRow');	// 用 row 的 children 判斷幾個column

	// pageX/left 看 column 的 width
	var widthCurrentTotal = 0;
	for(var i = 0; i < 8; i++){
		// debugger;
		// 取值的時候要用 .offsetWidth, 不能用 .style.width(只有賦值的時候可以用)
		var widthCurrentCell = parseInt(row.children[i].offsetWidth);
		widthCurrentTotal += widthCurrentCell;
		widthRangeOfCell[i] = widthCurrentTotal;

		// 也可以用 .offsetLeft 來做, widthRangeOfCell[0] = Mon.offsetLeft
		//                          widthRangeOfCell[1] = Tue.offsetLeft
		// 不過要特別處理最後一項, 用 Sun 的 offsetLeft+offsetWidth
		// widthRangeOfCell[i] = parseInt(row.children[i+1].offsetLeft); 
	}
	// pageY/top 看 row 的 height
	var heightCurrentTotal = 0;
	for(var i = 0; i < 17; i++){		// 這裡要釘死, 因為 table 的 children 個數會一直增加
		// 取值的時候要用 .offsetHeight, 不能用 .style.height(只有賦值的時候可以用)
		var heightCurrentCell = parseInt(table.children[i].offsetHeight);
		heightCurrentTotal += heightCurrentCell;
		heightRangeOfCell[i] = heightCurrentTotal;
	}
	
	// console.log(widthRangeOfCell);
	// console.log(heightRangeOfCell);
}
function getPositionWithOffsetFromTable(event){
	return {x: event.pageX - table.offsetLeft,
			y: event.pageY - table.offsetTop};
}
function setRectWidthHeight(element,width,height){
	element.style.width = width + 'px';		
	element.style.height = height + 'px';		
}
function setRectLeftTop(element,left,top){
	element.style.left = left + 'px';
	element.style.top = top + 'px';
}
function updateVerticesOfImagRect(newWidth, newHeight){
	vertices = {	// 這裡抓的四個頂點是對應 pageX/pageY 還沒有扣除 table 的 offsetLeft/Top的位置
		topleft : new Vector(parseInt(imagRect.style.left), parseInt(imagRect.style.top)),
		topright: new Vector(parseInt(imagRect.style.left)+newWidth, parseInt(imagRect.style.top)),
		bottomleft : new Vector(parseInt(imagRect.style.left), parseInt(imagRect.style.top)+newHeight),
		bottomright: new Vector(parseInt(imagRect.style.left)+newWidth, parseInt(imagRect.style.top)+newHeight)
	};
	// console.log(vertices);

	// 如果 整個 imagRect 都在 table 外面, 即使有跨到 time那格cell, 都不更新 verticesCell
	
	formMapOfRange();
	
	// 下面的 if-else 是判斷, 如果產生的 imagRect 落在 table 外面, 就不更新 verticesCell, 省一些計算量, 不過會有error
	if( vertices.bottomright.left < widthRangeOfCell[0] || vertices.topleft.left > widthRangeOfCell[7] ||
		vertices.bottomright.top < heightRangeOfCell[0] || vertices.topleft.top > heightRangeOfCell[16]){
		console.log('imagRect is not within table');
	}
	else{
		verticesCell = {	// 這裡再把 vertices 的 位置px 轉換成 哪一個cell[row,col]
			topleft : inWhichCell(vertices.topleft.left, vertices.topleft.top),
			topright: inWhichCell(vertices.topright.left, vertices.topright.top),
			bottomleft : inWhichCell(vertices.bottomleft.left, vertices.bottomleft.top),
			bottomright: inWhichCell(vertices.bottomright.left, vertices.bottomright.top)
		};
	}
	// console.log(verticesCell);
}
// posLeft/posTop是 pageX - table.offsetLeft 的值
function inWhichCell(posLeft,posTop){	
	// formMapOfRange();
	var row = 1, 		// default 給 1, 就是 下面一組 if - else if - else 的 else
		col = 1;
	// 分別辨識 col 與 row
	if(posLeft > widthRangeOfCell[0] && posLeft < widthRangeOfCell[7]){
		col = binarySearch(posLeft, widthRangeOfCell);
	}
	else if(posLeft >= widthRangeOfCell[7]){
		col = 7;
	}
	if(posTop > heightRangeOfCell[0] && posTop < heightRangeOfCell[16]){
		row = binarySearch(posTop, heightRangeOfCell);
	}
	else if(posTop >= heightRangeOfCell[16]){
		row = 16;
	}
	// 上面兩個else if 要處理：有可能在 displayCol 外面拉出 imagRect
	
	// 回傳一整個 cell 的 element 和 row col
	return {element: table.children[row].children[col], 
			row: row, 
			col: col};
}
function binarySearch(position, array){
	var low = 1, 
		high = array.length - 1, 
		middle;
	while(low <= high){
		middle = Math.floor((low+high)/2);
		if( (position <= array[middle]) && 
			(position > array[middle-1]) ){
			return middle;
		}
		else{
			if(position > array[middle]){
				low = middle + 1;
			}
			else{
				high = middle - 1;
			}
		}
	}
	// exception handling
	return 1;
}

///////////////////////////////////////////////////
//
//		localStorage 的 save 和 load
//
///////////////////////////////////////////////////


window.addEventListener('load', function(event){
	if(!localStorage.hasOwnProperty('schedule')){		
		schedule = new Schedule({});
		saveToStorage();
	}									
	else{
		loadFromStorage();
		putItemOnDOM();
	}
});
function saveToStorage(){
	// 把整個 object 放進去, 不是只有放 array
	// 在 loadFromStorage() 的時候把整個 object 拿去 new Schedule
	localStorage.setItem('schedule', JSON.stringify(schedule)); 
}
function loadFromStorage(){
	// 目前看起來, localStorage 沒有辦法連 object 的 method/ prototype 一起存
	// 所以每次 load 都要 先取出上次存入的 schedule(整個object)
	// 再把 object 裡面的 array 取出來
	// 然後以array作為arg, 創造新的schedule object, new Schedule( arg )

	var scheduleObject = JSON.parse(localStorage.getItem('schedule'));
	schedule = new Schedule(scheduleObject);
}
function putItemOnDOM(){
	// DOM & flag

	// 這裡要做更複雜的前處理, 有可能螢幕縮放後, 從widthRangeOfCell開始跑掉
	// 所以要從抓, 所有和position有關的property全部重設

	// if(判斷 如果div的left 和 rowFrom的offsetLeft 不一樣, 就重跑 )

	// console.log(schedule.array.length);
	if(schedule.array.length != 0){
		
		testIfResizingAllDiv();

		// schedule.array.forEach(function(entry){
		// 	var item = createElementWithItem('div','finalDiv', entry);
		// 	item.children[0].addEventListener('click', clickToEditForDiv);
		// 	table.appendChild(item);
		// 	toggleInvolvedCell(item.rowFrom, item.rowTo, item.colFrom, item.colTo);
		// });	
	}
	

	// 處理 title, subtitle, timeScales
	if(schedule.title != ''){
		var newTitle = createElementWithID('h2', 'title');
		newTitle.textContent = schedule.title;
		newTitle.addEventListener('click', clickToEditForTitle);
		title.parentNode.replaceChild(newTitle, title);
	}
	if(schedule.subtitle != ''){
		var newTitle = createElementWithID('h3', 'subtitle');
		newTitle.textContent = schedule.subtitle;
		newTitle.addEventListener('click', clickToEditForTitle);
		subtitle.parentNode.replaceChild(newTitle, subtitle);
	}
	if(schedule.startTime != undefined){
		var timeScales = document.querySelectorAll('.time span');
		// debugger;
		var startTime = schedule.startTime;
		for(var i = 2, length = timeScales.length; i < length; i = i + 2){
			timeScales[i].textContent = (startTime++)%24;	// assgin 完再 ++
			timeScales[i+1].textContent = (startTime)%24;
		}
	}
}


function testIfResizingAllDiv(){
	var testCellRow = schedule.array[0].rowFrom,
		testCellCol = schedule.array[0].colFrom;
	var testCell = table.children[testCellRow].children[testCellCol];
	if(testCell.offsetLeft != schedule.array[0].left ||
		testCell.offsetTop != schedule.array[0].top){
		
		schedule.array.forEach(function(entry){
			var cellTopLeft = table.children[entry.rowFrom].children[entry.colFrom];
			var cellBottomRight = table.children[entry.rowTo].children[entry.colTo];
			entry.left = cellTopLeft.offsetLeft + 'px';
			entry.top = cellTopLeft.offsetTop + 'px';
			entry.width = (cellBottomRight.offsetLeft-cellTopLeft.offsetLeft+cellBottomRight.offsetWidth) - 2*5 + 'px';
			entry.height = (cellBottomRight.offsetTop-cellTopLeft.offsetTop+cellBottomRight.offsetHeight) - 2*5 + 'px';

			var item = createElementWithItem('div','finalDiv', entry);
			item.children[0].addEventListener('click', clickToEditForDiv);
			table.appendChild(item);
			toggleInvolvedCell(item.rowFrom, item.rowTo, item.colFrom, item.colTo);
		});	

	}
}

// setRectLeftTop(inputDiv, cellTopLeft.element.offsetLeft, cellTopLeft.element.offsetTop);
// setRectWidthHeight( inputDiv, 
// (widthRangeOfCell[cellBottomRight.col]-widthRangeOfCell[cellTopLeft.col-1] -2*2 -2*2), 
// (heightRangeOfCell[cellBottomRight.row]-heightRangeOfCell[cellTopLeft.row-1] -2*2 -2*2));


///////////////////////////////////////////////////
//
//		處理 title, subtitle, time scale
//
///////////////////////////////////////////////////


var title = document.querySelector('#title');
var subtitle = document.querySelector('#subtitle');


title.addEventListener('click', clickToEditForTitle);
subtitle.addEventListener('click', clickToEditForTitle);


function clickToEditForTitle(event){
	if(event.target.id == 'title'){
		var inputTitle = createElementWithClass('input', 'inputTitle');
	}
	else{
		var inputTitle = createElementWithClass('input', 'inputSubTitle');
	}
	
	inputTitle.value = this.textContent;
	inputTitle.addEventListener('keydown', handleKeyDownForTitle);
	inputTitle.addEventListener('blur', handleBlurForTitle);
	this.parentNode.replaceChild(inputTitle, this);
	inputTitle.focus();
}

function handleBlurForTitle(event){
	storeTitle(event);
	generateNewTitle(event);
}

function handleKeyDownForTitle(event){
	if(event.keyCode == 13){
		event.target.removeEventListener('blur', handleBlurForTitle);
		storeTitle(event);
		generateNewTitle(event);
	}
}
function storeTitle(event){
	if(event.target.className == 'inputTitle'){
		schedule.title = event.target.value;
	}
	else{
		schedule.subtitle = event.target.value;
	}
	saveToStorage();
}

function generateNewTitle(event){
	if(event.target.className == 'inputTitle'){
		var newTitle = createElementWithID('h2', 'title');
	}
	else{
		var newTitle = createElementWithID('h3', 'subtitle');
	}
	newTitle.textContent = event.target.value;
	newTitle.addEventListener('click', clickToEditForTitle);
	event.target.parentNode.replaceChild(newTitle, event.target);
}

