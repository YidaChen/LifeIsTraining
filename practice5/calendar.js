
/*
	剩下兩件事：

	1. 最後一步, 看是要 全部刪除 還是用 replaceChild() 更新 row[] 的 ChildNodes[]

	2. 突然變成 inline-block 不行, float 可以
	   搞屁？ 研究一下問題出在哪？ 是不是不要用 text-align: center

	   解決的辦法： 可以每次都印 35格, 再控制哪裡有數字出現, 或是研究 float


*/

/*  讀取 year 和 month 的 input  */


// 把 event handler 加在 window element上面, 
// 用 document.addEventListener() 沒有反應

window.addEventListener("load", function(event){

	var dt = new Date();
	// dt.getFullYear() : 2016
	// dt.getMonth(): 0->Jan, 1->Feb
	ShowMonthandYear(dt.getFullYear(), (dt.getMonth()+1));
	PrintCalendar(dt.getFullYear(),(dt.getMonth()+1));
});

function ShowMonthandYear(year, month){

	var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	var dateToShow = document.querySelector("#date-to-show");
	dateToShow.textContent = months[month]+", "+year;
}


var send = document.querySelector("#send-btn");
send.addEventListener("click", function(event){

	var year = document.querySelectorAll("input")[0].value;
	var month = document.querySelectorAll("input")[1].value;

	if(1 <= Number(month) && Number(month) <= 12){
		ResetCalendar();
		ShowMonthandYear(year, month);
		PrintCalendar(year, month);
	}
});

function ResetCalendar(){

	var rows = document.querySelectorAll(".row");
	for(var i = 1; i < rows.length; i++){
		while(rows[i].children.length != 0){
			rows[i].removeChild(rows[i].children[0]);
			// console.log(rows[i].children.length);
			// console.log(rows[i]);
		}
	}
}

/*  印出月曆  */

function PrintCalendar(year, month){

	var howManyDayToPrint = 0;
	howManyDayToPrint = CountDayforMonth(year, month, howManyDayToPrint);

	var firstDayofInputDate = FirstDayofInputDate(year, month);
	howManyDayToPrint += firstDayofInputDate;

	var rows = document.querySelectorAll(".row");
	var j = 1;     // idx for rows
	for(var i = 1; i <= howManyDayToPrint; i++){
		
		var date = document.createElement("span");
		date.className = "week";

		if(i <= firstDayofInputDate){
			date.textContent = "";
		}
		else{
			date.textContent = String(i-firstDayofInputDate);
		}
		rows[j].appendChild(date);

		if(i % 7 == 0){
			j++;	
		}
	}

}

/*  計算月曆  */

// 看要不要做防呆, year 跟 month 要是數字, month 在 1~12 之間 , 可以不用
function FirstDayofInputDate(year, month){

	var distance = 0;
    distance = NumOfDayFromYear(year, distance);           // 和 2006 差幾年, 並考慮閏年, 計算差幾天
    distance = NumOfDayFromMonth(year, month, distance);   // 和 1月 差幾個月, 要考慮閏月, 計算差幾天
    
    if(year >= 2006){
		return (distance % 7);   // 回傳month月1號是星期幾
	}
	else{
		return (7-(distance%7))%7;
	}
}
function IsLeapYear(year){
	if((Number(year)%400 == 0) || ((Number(year)%4 == 0) && (Number(year)%100 != 0))){
		return true;
	}
	else{
		return false;
	}
}
function NumOfDayFromYear(year, dayCount){
    
    // method1: scan, reference: 2006
    if(year >= 2006){
	    for(var i = 2006; i < year; i++){
	    	dayCount = CountDayforYear(i, dayCount);
	    }
	}
	else{
		for(var i = 2005; i > year; i--){
			dayCount = CountDayforYear(i, dayCount);
		}
	}
	return dayCount;
}

function CountDayforYear(year, dayCount){
	if(IsLeapYear(year)){
		dayCount += 366;
	}
	else{
		dayCount += 365;
	}
	return dayCount;
}
function NumOfDayFromMonth(year, month, dayCount){

	// method1: scan
	if(year >= 2006){
	    for(var i = 1; i < month; i++){
		    dayCount = CountDayforMonth(year, i, dayCount);
	    }
	}
	else{
		for(var i = 12; i >= month; i--){
			dayCount = CountDayforMonth(year, i, dayCount);
		}
	}
	return dayCount;
}

function CountDayforMonth(year, month, howManyDayToPrint){
	// method#1: if-else
	// if((month==4) || (month==6) || (month==9) || (month==11)){
	// 	howManyDayToPrint += 30;
	// }
	// else if(month==2){
	// 	if(IsLeapYear(year)){
	// 		howManyDayToPrint += 29;
	// 	}
	// 	else{
	// 		howManyDayToPrint += 28;
	// 	}
	// }
	// else{
	// 	howManyDayToPrint += 31;
	// }

	// method#2: 利用一個 map 會比較簡潔
	var numOfDaysOfMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31];

	if(IsLeapYear(year) && month == 2){
		howManyDayToPrint += 29;
	}
	else {
		howManyDayToPrint += numOfDaysOfMonth[month];
	}
	return howManyDayToPrint;

	// 這裡  howManyDayToPrint  傳不出去, 沒有辦法像 C++ 用 reference 傳進 function
	// 解決方法一：使用object, 就可以改完拿出function
	// ref: http://stackoverflow.com/questions/7744611/pass-variables-by-reference-in-javascript
	// 解決辦法二：用return
}


