

/////////////////  處理  Drag and Drop  ////////////////////


var blocks = document.querySelectorAll(".block");

var dragSrcElement = null;

Array.prototype.forEach.call(blocks, function(block){
	block.addEventListener("dragstart", HandleDragStart, false);
	block.addEventListener("dragenter", HandleDragEnter, false);
	block.addEventListener("dragover", HandleDragOver, false);
	block.addEventListener("dragleave", HandleDragLeave, false);
	block.addEventListener("drop", HandleDrop, false);
	block.addEventListener("dragend", HandleDragEnd, false);
});

function HandleDrop(event){
	// 這裡的 event 是將要被取代的 element
	// if (event.stopPropagation) {
		event.preventDefault();
    	event.stopPropagation(); // Stops some browsers from redirecting.
	// }
	if(dragSrcElement != this){
		// var strImage = "'"+this.style.backgroundImage+"'";
		dragSrcElement.style.backgroundImage = this.style.backgroundImage;  
		// 上面這一行改 觸發dragstart 的 eleemnt 的背景
		this.style.backgroundImage = event.dataTransfer.getData("text/plain");
		// 上面這一行改 要被換掉的 element 的背景
		/*
			AB-test 結果, .getData("text/html") 失敗
                         .getData("text/uri-list") 失敗
		*/

		// 用 innerHTML 不好, 把 DnD 後的 DOM 打開, 調整後的element裡面會有怪東西, <meta>之類的
		// 想辦法替換掉
	}

	// var id = event.target.id;   // id: img00, img01, img02,...,img23
	// console.log(id);
	// 檢查 觸發dragstart的element
	IsMatched(dragSrcElement.id, dragSrcElement.style.backgroundImage);
	// 檢查 被移動的element
	IsMatched(event.target.id, event.target.style.backgroundImage);


	/////// 接著判斷是否完成
	if(IsFinished()){
		console.log("Finished!");
		// 顯示完成指示
		function ShowCongradulation(){
			var puzzleDiv = document.querySelector("#puzzle");
			puzzle.classList.add("finish");
			var finishText = document.querySelector("#finish");
			finishText.textContent = "OK, You Are A Pro!";
		}
		ShowCongradulation();
	}

	return false;
}

function HandleDragStart(event){
	// 這裡的 event.target == this 也就是一開始觸發 dragstart 的element
	event.target.style.opacity = "0.4";
	console.log(event.target.style.backgroundImage);

	// 下面三行結合 HandleDrop() 的code 要做 "swap"
	// temp = a; a = b; b = temp;
	dragSrcElement = this;    
	// 這裡把 「觸發 dragstart」的element放進 global variable:dragSrcElement 裡面
	// 到 HandleDrop() 裡面就可以直接呼叫

	// .effectAllowed 和 被drop的element的行為有關, 有些是 link, drop 之後可能會開啟新分頁 之類的
	// 所以要限制 effect
	event.dataTransfer.effectAllowed = "move";

	// var strImage = "'"+this.style.backgroundImage+"'";
	// console.log(strImage);
	event.dataTransfer.setData("text/plain", event.target.style.backgroundImage);
	/*  這裡的 .setData(arg1, arg2) 的arg1 與 HandleDrop()的 .getData(arg) 的arg 同步
		AB-test 結果, .getData("text/html") 失敗
                     .getData("text/uri-list") 失敗
        this.style.backgroundImage 是長這樣的東西： url("img/dumpling_03.png")
	*/
	
	// 這裡搭配 HandleDrop() 看, 像是 swap, 把東西暫存在 dataTransfer 裡面
}

function HandleDragEnd(event){
	// 在 dragstart 加上的 effect 可以在 dragend 移除
	// 這裡的 event.target == this 也就是一開始觸發 dragstart 的element
	this.style.opacity = "1";
	[].forEach.call(blocks, function(block){
		block.classList.remove("over");
	});
}

function HandleDragEnter(event){
	/*	此時的 event 是「目前被hover的那個」
		把某個element dragged住, 拖來拖去, 被hover的element都會被賦予 dashed border
	*/ 
	this.classList.add("over");     // 在 .css 裡要先定義好 class: over 的 style
}

function HandleDragOver(event){
	// 有些code有 if(), 再研究看看什麼情況需要 condition 
	// if(event.preventDefault){
		event.preventDefault();               // 如果要 drop, 這行很重要, 不然會開啟圖片連結之類的
	// }
	event.dataTransfer.dropEffect = "move";   //  move 還不知道在幹嘛

	// 這個 return false 也要再研究一下
	return false;
}

function HandleDragLeave(event){
	/*	dragleave 和 dragenter 是相對的, 
		如果有某個 style/effect 在 dragenter 加上
		就在 dragleave 移除
	*/
	this.classList.remove("over");
	console.log("dragleave called");
}



///////////////  判斷是否正確  ////////////////

var matched = [[false, false, false, false], 
			   [false, false, false, false], 
			   [false, false, false, false]];

function IsMatched(imgID, imgURL){
	// imgID 是 img00, img01,... , img23
	// imgURL 是 url("img/dumpling_00.png"), url("img/dumpling_01.png"),...
	var id = imgID.slice(3,5);        // id: 00, 01, 02,..., 23
	if(imgURL.indexOf(id) != -1){
		matched[id[0]][id[1]] = true;
	}
	else{
		matched[id[0]][id[1]] = false;
	}
	console.log(matched);
}

function IsFinished(){

	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 4; j++){
			if(matched[i][j] == false){
				// console.log("not finished");
				return false;
			}
		}
	}
	// console.log("finished");
	return true;
}


///////////////  Random 打散 backgroundImage   ////////////// 

// 設計時器, load 之後 3秒 打散
// 打散的同時要assign matched[] 到相對應的 true/false


window.setTimeout(function(){
	// 洗牌
	ReDistribute();
},3000);

// 用random swap 做permutation

function swapBackgroundImage(arr, i, j){
	var temp = arr[i].style.backgroundImage;
	arr[i].style.backgroundImage = arr[j].style.backgroundImage;
	arr[j].style.backgroundImage = temp;
}

function ReDistribute(){
	for(var i = 0; i < blocks.length-1; i++){
		var pos = Math.floor(Math.random()*(blocks.length-i))+i;
		swapBackgroundImage(blocks, i, pos);
		IsMatched(blocks[i].id, blocks[i].style.backgroundImage);   // 跟著 swap 調整 matched[]
	}	
}









