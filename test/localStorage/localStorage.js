/*  test localstorage
	
	Ref: http://techaride.blogspot.tw/2012/07/javascript-localstorage.html

*/

/* set items   基本的 key-value, 如果要存 array/object 需要用到 JSON  */
window.localStorage.setItem("TechARide","TAR");
// another way
localStorage["Zam"] = "Zam";
localStorage["today"] = 20120710;

/* get items */
console.log(localStorage.getItem("TechARide"));		// TAR
// another way
console.log(localStorage["Zam"]);					// Zam
console.log(localStorage["today"]);					// 20120710


/* get lenth */
console.log("length = " + localStorage.length);     //length = 3

/* get key DOMString */
for (var key in localStorage){     // 這裡要用 給 object 用的 for loop, 無法用 indexed-for loop
	console.log(key);
}

// TechARide
// Zam
// today

/* clear */
localStorage.clear();        
console.log("length = " + localStorage.length);     // length = 0


